# Application Load Balancer
variable "environment" {
  description = "Environment name"
  type        = string
}

variable "domain_name" {
  description = "Domain name"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "public_subnet_ids" {
  description = "Public subnet IDs"
  type        = list(string)
}

variable "backend_target_group" {
  description = "Backend target group ARN"
  type        = string
}

variable "frontend_s3_bucket" {
  description = "Frontend S3 bucket domain"
  type        = string
}

variable "enable_ssl" {
  description = "Enable SSL certificate"
  type        = bool
  default     = true
}

# SSL Certificate
resource "aws_acm_certificate" "main" {
  count = var.enable_ssl ? 1 : 0

  domain_name               = var.domain_name
  subject_alternative_names = ["*.${var.domain_name}"]
  validation_method         = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name        = "ayvcodr-${var.environment}-cert"
    Environment = var.environment
    Project     = "AyvCodr"
  }
}

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "ayvcodr-${var.environment}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [data.aws_security_group.alb.id]
  subnets           = var.public_subnet_ids

  enable_deletion_protection = var.environment == "production"

  access_logs {
    bucket  = aws_s3_bucket.alb_logs.bucket
    prefix  = "alb"
    enabled = true
  }

  tags = {
    Name        = "ayvcodr-${var.environment}-alb"
    Environment = var.environment
    Project     = "AyvCodr"
  }
}

# S3 bucket for ALB access logs
resource "aws_s3_bucket" "alb_logs" {
  bucket = "ayvcodr-${var.environment}-alb-logs-${random_id.logs_suffix.hex}"

  tags = {
    Name        = "ayvcodr-${var.environment}-alb-logs"
    Environment = var.environment
    Project     = "AyvCodr"
  }
}

resource "random_id" "logs_suffix" {
  byte_length = 4
}

resource "aws_s3_bucket_policy" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_elb_service_account.main.id}:root"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.alb_logs.arn}/*"
      }
    ]
  })
}

resource "aws_s3_bucket_lifecycle_configuration" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id

  rule {
    id     = "delete_old_logs"
    status = "Enabled"

    expiration {
      days = var.environment == "production" ? 90 : 30
    }
  }
}

# HTTPS Listener
resource "aws_lb_listener" "https" {
  count = var.enable_ssl ? 1 : 0

  load_balancer_arn = aws_lb.main.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS-1-2-2017-01"
  certificate_arn   = aws_acm_certificate.main[0].arn

  default_action {
    type             = "forward"
    target_group_arn = var.backend_target_group
  }

  depends_on = [aws_acm_certificate.main]
}

# HTTP Listener (redirect to HTTPS)
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type = var.enable_ssl ? "redirect" : "forward"
    
    dynamic "redirect" {
      for_each = var.enable_ssl ? [1] : []
      content {
        port        = "443"
        protocol    = "HTTPS"
        status_code = "HTTP_301"
      }
    }

    dynamic "forward" {
      for_each = var.enable_ssl ? [] : [1]
      content {
        target_group {
          arn = var.backend_target_group
        }
      }
    }
  }
}

# WAF Web ACL for additional security
resource "aws_wafv2_web_acl" "main" {
  name  = "ayvcodr-${var.environment}-waf"
  scope = "REGIONAL"

  default_action {
    allow {}
  }

  # Rate limiting rule
  rule {
    name     = "RateLimitRule"
    priority = 1

    override_action {
      none {}
    }

    statement {
      rate_based_statement {
        limit              = var.environment == "production" ? 2000 : 1000
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "RateLimitRule"
      sampled_requests_enabled   = true
    }

    action {
      block {}
    }
  }

  # AWS Managed Core Rule Set
  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 2

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "CommonRuleSetMetric"
      sampled_requests_enabled   = true
    }
  }

  tags = {
    Name        = "ayvcodr-${var.environment}-waf"
    Environment = var.environment
    Project     = "AyvCodr"
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "ayvcodr-${var.environment}-waf"
    sampled_requests_enabled   = true
  }
}

# Associate WAF with ALB
resource "aws_wafv2_web_acl_association" "main" {
  resource_arn = aws_lb.main.arn
  web_acl_arn  = aws_wafv2_web_acl.main.arn
}

# Data sources
data "aws_security_group" "alb" {
  name = "ayvcodr-${var.environment}-alb-sg"
}

data "aws_elb_service_account" "main" {}

# Outputs
output "alb_dns_name" {
  description = "DNS name of the load balancer"
  value       = aws_lb.main.dns_name
}

output "alb_zone_id" {
  description = "Zone ID of the load balancer"
  value       = aws_lb.main.zone_id
}

output "certificate_arn" {
  description = "ARN of the SSL certificate"
  value       = var.enable_ssl ? aws_acm_certificate.main[0].arn : null
}

output "waf_web_acl_arn" {
  description = "ARN of the WAF Web ACL"
  value       = aws_wafv2_web_acl.main.arn
}