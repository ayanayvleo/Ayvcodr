# Comprehensive Monitoring and Logging Infrastructure
variable "environment" {
  description = "Environment name"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "ecs_cluster_name" {
  description = "ECS cluster name"
  type        = string
}

variable "ecs_service_name" {
  description = "ECS service name"
  type        = string
}

variable "alb_arn" {
  description = "Application Load Balancer ARN"
  type        = string
}

variable "db_instance_identifier" {
  description = "RDS instance identifier"
  type        = string
}

# CloudTrail for API auditing
resource "aws_cloudtrail" "main" {
  name           = "ayvcodr-${var.environment}-cloudtrail"
  s3_bucket_name = aws_s3_bucket.cloudtrail.bucket

  include_global_service_events = true
  is_multi_region_trail        = true
  enable_logging               = true

  event_selector {
    read_write_type           = "All"
    include_management_events = true

    data_resource {
      type   = "AWS::S3::Object"
      values = ["arn:aws:s3:::*/*"]
    }
  }

  tags = {
    Name        = "ayvcodr-${var.environment}-cloudtrail"
    Environment = var.environment
    Project     = "AyvCodr"
  }
}

# S3 bucket for CloudTrail logs
resource "aws_s3_bucket" "cloudtrail" {
  bucket = "ayvcodr-${var.environment}-cloudtrail-${random_id.cloudtrail_suffix.hex}"

  tags = {
    Name        = "ayvcodr-${var.environment}-cloudtrail"
    Environment = var.environment
    Project     = "AyvCodr"
  }
}

resource "random_id" "cloudtrail_suffix" {
  byte_length = 4
}

resource "aws_s3_bucket_policy" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AWSCloudTrailAclCheck"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.cloudtrail.arn
      },
      {
        Sid    = "AWSCloudTrailWrite"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.cloudtrail.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      }
    ]
  })
}

# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "AyvCodr-${var.environment}"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/ApplicationELB", "RequestCount", "LoadBalancer", var.alb_arn],
            [".", "TargetResponseTime", ".", "."],
            [".", "HTTPCode_Target_2XX_Count", ".", "."],
            [".", "HTTPCode_Target_4XX_Count", ".", "."],
            [".", "HTTPCode_Target_5XX_Count", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = data.aws_region.current.name
          title   = "Application Load Balancer Metrics"
          period  = 300
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/ECS", "CPUUtilization", "ServiceName", var.ecs_service_name, "ClusterName", var.ecs_cluster_name],
            [".", "MemoryUtilization", ".", ".", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = data.aws_region.current.name
          title   = "ECS Service Metrics"
          period  = 300
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 12
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/RDS", "CPUUtilization", "DBInstanceIdentifier", var.db_instance_identifier],
            [".", "DatabaseConnections", ".", "."],
            [".", "ReadLatency", ".", "."],
            [".", "WriteLatency", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = data.aws_region.current.name
          title   = "RDS Database Metrics"
          period  = 300
        }
      }
    ]
  })
}

# CloudWatch Alarms for ECS
resource "aws_cloudwatch_metric_alarm" "ecs_cpu_high" {
  alarm_name          = "ayvcodr-${var.environment}-ecs-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors ECS CPU utilization"
  alarm_actions       = var.environment == "production" ? [aws_sns_topic.alerts.arn] : []

  dimensions = {
    ServiceName = var.ecs_service_name
    ClusterName = var.ecs_cluster_name
  }

  tags = {
    Name        = "ayvcodr-${var.environment}-ecs-cpu-alarm"
    Environment = var.environment
    Project     = "AyvCodr"
  }
}

resource "aws_cloudwatch_metric_alarm" "ecs_memory_high" {
  alarm_name          = "ayvcodr-${var.environment}-ecs-memory-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "MemoryUtilization"
  namespace           = "AWS/ECS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors ECS memory utilization"
  alarm_actions       = var.environment == "production" ? [aws_sns_topic.alerts.arn] : []

  dimensions = {
    ServiceName = var.ecs_service_name
    ClusterName = var.ecs_cluster_name
  }

  tags = {
    Name        = "ayvcodr-${var.environment}-ecs-memory-alarm"
    Environment = var.environment
    Project     = "AyvCodr"
  }
}

# CloudWatch Alarms for ALB
resource "aws_cloudwatch_metric_alarm" "alb_response_time" {
  alarm_name          = "ayvcodr-${var.environment}-alb-response-time-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "TargetResponseTime"
  namespace           = "AWS/ApplicationELB"
  period              = "300"
  statistic           = "Average"
  threshold           = "1"
  alarm_description   = "This metric monitors ALB response time"
  alarm_actions       = var.environment == "production" ? [aws_sns_topic.alerts.arn] : []

  dimensions = {
    LoadBalancer = var.alb_arn
  }

  tags = {
    Name        = "ayvcodr-${var.environment}-alb-response-time-alarm"
    Environment = var.environment
    Project     = "AyvCodr"
  }
}

resource "aws_cloudwatch_metric_alarm" "alb_5xx_errors" {
  alarm_name          = "ayvcodr-${var.environment}-alb-5xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "HTTPCode_Target_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "This metric monitors ALB 5XX errors"
  alarm_actions       = var.environment == "production" ? [aws_sns_topic.alerts.arn] : []

  dimensions = {
    LoadBalancer = var.alb_arn
  }

  tags = {
    Name        = "ayvcodr-${var.environment}-alb-5xx-errors-alarm"
    Environment = var.environment
    Project     = "AyvCodr"
  }
}

# X-Ray tracing for application monitoring
resource "aws_xray_sampling_rule" "main" {
  rule_name      = "ayvcodr-${var.environment}-sampling"
  priority       = 9000
  version        = 1
  reservoir_size = 1
  fixed_rate     = 0.1
  url_path       = "*"
  host           = "*"
  http_method    = "*"
  service_type   = "*"
  service_name   = "*"
  resource_arn   = "*"

  tags = {
    Name        = "ayvcodr-${var.environment}-xray-sampling"
    Environment = var.environment
    Project     = "AyvCodr"
  }
}

# SNS Topic for alerts
resource "aws_sns_topic" "alerts" {
  name = "ayvcodr-${var.environment}-monitoring-alerts"

  tags = {
    Name        = "ayvcodr-${var.environment}-alerts"
    Environment = var.environment
    Project     = "AyvCodr"
  }
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "application" {
  name              = "/aws/ayvcodr/${var.environment}/application"
  retention_in_days = var.environment == "production" ? 30 : 7

  tags = {
    Name        = "ayvcodr-${var.environment}-app-logs"
    Environment = var.environment
    Project     = "AyvCodr"
  }
}

resource "aws_cloudwatch_log_group" "security" {
  name              = "/aws/ayvcodr/${var.environment}/security"
  retention_in_days = var.environment == "production" ? 90 : 30

  tags = {
    Name        = "ayvcodr-${var.environment}-security-logs"
    Environment = var.environment
    Project     = "AyvCodr"
  }
}

# Custom CloudWatch Metrics Filter
resource "aws_cloudwatch_log_metric_filter" "error_count" {
  name           = "ayvcodr-${var.environment}-error-count"
  log_group_name = aws_cloudwatch_log_group.application.name
  pattern        = "ERROR"

  metric_transformation {
    name      = "ErrorCount"
    namespace = "AyvCodr/${var.environment}"
    value     = "1"
  }
}

resource "aws_cloudwatch_metric_alarm" "error_rate" {
  alarm_name          = "ayvcodr-${var.environment}-high-error-rate"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "ErrorCount"
  namespace           = "AyvCodr/${var.environment}"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "This metric monitors application error rate"
  alarm_actions       = var.environment == "production" ? [aws_sns_topic.alerts.arn] : []

  tags = {
    Name        = "ayvcodr-${var.environment}-error-rate-alarm"
    Environment = var.environment
    Project     = "AyvCodr"
  }
}

# Data sources
data "aws_region" "current" {}

# Outputs
output "cloudtrail_arn" {
  description = "CloudTrail ARN"
  value       = aws_cloudtrail.main.arn
}

output "dashboard_url" {
  description = "CloudWatch Dashboard URL"
  value       = "https://${data.aws_region.current.name}.console.aws.amazon.com/cloudwatch/home?region=${data.aws_region.current.name}#dashboards:name=${aws_cloudwatch_dashboard.main.dashboard_name}"
}

output "sns_topic_arn" {
  description = "SNS Topic ARN for alerts"
  value       = aws_sns_topic.alerts.arn
}

output "xray_sampling_rule_arn" {
  description = "X-Ray sampling rule ARN"
  value       = aws_xray_sampling_rule.main.arn
}