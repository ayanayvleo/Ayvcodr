# Security Infrastructure and Best Practices
variable "environment" {
  description = "Environment name"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "domain_name" {
  description = "Domain name"
  type        = string
}

# AWS Config for compliance monitoring
resource "aws_config_configuration_recorder" "main" {
  name     = "ayvcodr-${var.environment}-config-recorder"
  role_arn = aws_iam_role.config.arn

  recording_group {
    all_supported                 = true
    include_global_resource_types = true
  }

  depends_on = [aws_config_delivery_channel.main]
}

resource "aws_config_delivery_channel" "main" {
  name           = "ayvcodr-${var.environment}-config-delivery-channel"
  s3_bucket_name = aws_s3_bucket.config.bucket
}

resource "aws_s3_bucket" "config" {
  bucket = "ayvcodr-${var.environment}-config-${random_id.config_suffix.hex}"

  tags = {
    Name        = "ayvcodr-${var.environment}-config"
    Environment = var.environment
    Project     = "AyvCodr"
  }
}

resource "random_id" "config_suffix" {
  byte_length = 4
}

resource "aws_s3_bucket_policy" "config" {
  bucket = aws_s3_bucket.config.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AWSConfigBucketPermissionsCheck"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.config.arn
      },
      {
        Sid    = "AWSConfigBucketExistenceCheck"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:ListBucket"
        Resource = aws_s3_bucket.config.arn
      },
      {
        Sid    = "AWSConfigBucketDelivery"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.config.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      }
    ]
  })
}

# IAM Role for AWS Config
resource "aws_iam_role" "config" {
  name = "ayvcodr-${var.environment}-config-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "ayvcodr-${var.environment}-config-role"
    Environment = var.environment
    Project     = "AyvCodr"
  }
}

resource "aws_iam_role_policy_attachment" "config" {
  role       = aws_iam_role.config.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/ConfigRole"
}

# AWS Config Rules for security compliance
resource "aws_config_config_rule" "s3_bucket_public_access_prohibited" {
  name = "s3-bucket-public-access-prohibited"

  source {
    owner             = "AWS"
    source_identifier = "S3_BUCKET_PUBLIC_ACCESS_PROHIBITED"
  }

  depends_on = [aws_config_configuration_recorder.main]

  tags = {
    Name        = "ayvcodr-${var.environment}-s3-public-access-rule"
    Environment = var.environment
    Project     = "AyvCodr"
  }
}

resource "aws_config_config_rule" "encrypted_volumes" {
  name = "encrypted-volumes"

  source {
    owner             = "AWS"
    source_identifier = "ENCRYPTED_VOLUMES"
  }

  depends_on = [aws_config_configuration_recorder.main]

  tags = {
    Name        = "ayvcodr-${var.environment}-encrypted-volumes-rule"
    Environment = var.environment
    Project     = "AyvCodr"
  }
}

resource "aws_config_config_rule" "rds_encrypted" {
  name = "rds-storage-encrypted"

  source {
    owner             = "AWS"
    source_identifier = "RDS_STORAGE_ENCRYPTED"
  }

  depends_on = [aws_config_configuration_recorder.main]

  tags = {
    Name        = "ayvcodr-${var.environment}-rds-encrypted-rule"
    Environment = var.environment
    Project     = "AyvCodr"
  }
}

# GuardDuty for threat detection
resource "aws_guardduty_detector" "main" {
  enable = true

  tags = {
    Name        = "ayvcodr-${var.environment}-guardduty"
    Environment = var.environment
    Project     = "AyvCodr"
  }
}

# SecurityHub for centralized security findings
resource "aws_securityhub_account" "main" {
  enable_default_standards = true
}

# Inspector for vulnerability assessment
resource "aws_inspector2_enabler" "main" {
  account_ids    = [data.aws_caller_identity.current.account_id]
  resource_types = ["ECR", "EC2"]
}

# Systems Manager Session Manager for secure access
resource "aws_iam_role" "ssm_instance_profile" {
  name = "ayvcodr-${var.environment}-ssm-instance-profile"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "ayvcodr-${var.environment}-ssm-instance-profile"
    Environment = var.environment
    Project     = "AyvCodr"
  }
}

resource "aws_iam_role_policy_attachment" "ssm_managed_instance_core" {
  role       = aws_iam_role.ssm_instance_profile.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_instance_profile" "ssm_profile" {
  name = "ayvcodr-${var.environment}-ssm-profile"
  role = aws_iam_role.ssm_instance_profile.name

  tags = {
    Name        = "ayvcodr-${var.environment}-ssm-profile"
    Environment = var.environment
    Project     = "AyvCodr"
  }
}

# KMS Keys for encryption
resource "aws_kms_key" "main" {
  description             = "KMS key for AyvCodr ${var.environment} encryption"
  deletion_window_in_days = var.environment == "production" ? 30 : 7

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow CloudWatch Logs"
        Effect = "Allow"
        Principal = {
          Service = "logs.${data.aws_region.current.name}.amazonaws.com"
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = "*"
      }
    ]
  })

  tags = {
    Name        = "ayvcodr-${var.environment}-kms-key"
    Environment = var.environment
    Project     = "AyvCodr"
  }
}

resource "aws_kms_alias" "main" {
  name          = "alias/ayvcodr-${var.environment}"
  target_key_id = aws_kms_key.main.key_id
}

# Secrets Manager for secure credential storage
resource "aws_secretsmanager_secret" "api_keys" {
  name                    = "ayvcodr/${var.environment}/api-keys"
  description             = "API keys and secrets for AyvCodr ${var.environment}"
  kms_key_id             = aws_kms_key.main.arn
  recovery_window_in_days = var.environment == "production" ? 30 : 0

  tags = {
    Name        = "ayvcodr-${var.environment}-api-keys"
    Environment = var.environment
    Project     = "AyvCodr"
  }
}

resource "aws_secretsmanager_secret_version" "api_keys" {
  secret_id = aws_secretsmanager_secret.api_keys.id
  secret_string = jsonencode({
    jwt_secret      = random_password.jwt_secret.result
    api_secret_key  = random_password.api_secret.result
  })
}

resource "random_password" "jwt_secret" {
  length  = 32
  special = true
}

resource "random_password" "api_secret" {
  length  = 32
  special = true
}

# IAM policies for least privilege access
resource "aws_iam_policy" "ecs_secrets_policy" {
  name        = "ayvcodr-${var.environment}-ecs-secrets-policy"
  description = "Policy for ECS tasks to access secrets and parameters"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = [
          aws_secretsmanager_secret.api_keys.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt"
        ]
        Resource = [
          aws_kms_key.main.arn
        ]
        Condition = {
          StringEquals = {
            "kms:ViaService" = "secretsmanager.${data.aws_region.current.name}.amazonaws.com"
          }
        }
      }
    ]
  })

  tags = {
    Name        = "ayvcodr-${var.environment}-ecs-secrets-policy"
    Environment = var.environment
    Project     = "AyvCodr"
  }
}

# CloudWatch Logs encryption
resource "aws_cloudwatch_log_group" "encrypted_logs" {
  name              = "/aws/ayvcodr/${var.environment}/encrypted"
  retention_in_days = var.environment == "production" ? 30 : 7
  kms_key_id        = aws_kms_key.main.arn

  tags = {
    Name        = "ayvcodr-${var.environment}-encrypted-logs"
    Environment = var.environment
    Project     = "AyvCodr"
  }
}

# Data sources
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# Outputs
output "kms_key_id" {
  description = "KMS Key ID for encryption"
  value       = aws_kms_key.main.key_id
}

output "kms_key_arn" {
  description = "KMS Key ARN for encryption"
  value       = aws_kms_key.main.arn
}

output "secrets_manager_arn" {
  description = "Secrets Manager ARN for API keys"
  value       = aws_secretsmanager_secret.api_keys.arn
}

output "guardduty_detector_id" {
  description = "GuardDuty Detector ID"
  value       = aws_guardduty_detector.main.id
}

output "config_recorder_name" {
  description = "AWS Config Recorder Name"
  value       = aws_config_configuration_recorder.main.name
}

output "ecs_secrets_policy_arn" {
  description = "ECS Secrets Policy ARN"
  value       = aws_iam_policy.ecs_secrets_policy.arn
}