# RDS PostgreSQL Database
variable "environment" {
  description = "Environment name"
  type        = string
}

variable "instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "private_subnet_ids" {
  description = "Private subnet IDs"
  type        = list(string)
}

# Random password for database
resource "random_password" "db_password" {
  length  = 32
  special = true
}

# Database subnet group
resource "aws_db_subnet_group" "main" {
  name       = "ayvcodr-${var.environment}-db-subnet-group"
  subnet_ids = var.private_subnet_ids

  tags = {
    Name        = "ayvcodr-${var.environment}-db-subnet-group"
    Environment = var.environment
    Project     = "AyvCodr"
  }
}

# Database security group
resource "aws_security_group" "database" {
  name        = "ayvcodr-${var.environment}-db-sg"
  description = "Security group for AyvCodr database"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "ayvcodr-${var.environment}-db-sg"
    Environment = var.environment
    Project     = "AyvCodr"
  }
}

# RDS instance
resource "aws_db_instance" "main" {
  identifier = "ayvcodr-${var.environment}-db"

  engine         = "postgres"
  engine_version = "15.4"
  instance_class = var.instance_class

  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type          = "gp2"
  storage_encrypted     = true

  db_name  = "ayvcodr"
  username = "ayvcodr_admin"
  password = random_password.db_password.result

  vpc_security_group_ids = [aws_security_group.database.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  backup_retention_period = var.environment == "production" ? 7 : 1
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"

  skip_final_snapshot = var.environment != "production"
  deletion_protection = var.environment == "production"

  performance_insights_enabled = var.environment == "production"
  monitoring_interval         = var.environment == "production" ? 60 : 0
  monitoring_role_arn        = var.environment == "production" ? aws_iam_role.rds_enhanced_monitoring[0].arn : null
  
  # Enable multi-AZ for production
  multi_az = var.environment == "production"
  
  # Enable minor version auto upgrade
  auto_minor_version_upgrade = true
  
  # Enable logging
  enabled_cloudwatch_logs_exports = ["postgresql"]
  
  # Use custom parameter group
  parameter_group_name = aws_db_parameter_group.main.name

  tags = {
    Name        = "ayvcodr-${var.environment}-db"
    Environment = var.environment
    Project     = "AyvCodr"
  }
}

# RDS Enhanced Monitoring IAM Role
resource "aws_iam_role" "rds_enhanced_monitoring" {
  count = var.environment == "production" ? 1 : 0
  
  name = "ayvcodr-${var.environment}-rds-enhanced-monitoring"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "monitoring.rds.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "ayvcodr-${var.environment}-rds-enhanced-monitoring"
    Environment = var.environment
    Project     = "AyvCodr"
  }
}

resource "aws_iam_role_policy_attachment" "rds_enhanced_monitoring" {
  count = var.environment == "production" ? 1 : 0
  
  role       = aws_iam_role.rds_enhanced_monitoring[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# DB Parameter Group for optimized PostgreSQL performance
resource "aws_db_parameter_group" "main" {
  family = "postgres15"
  name   = "ayvcodr-${var.environment}-postgres15"

  parameter {
    name  = "log_statement"
    value = var.environment == "production" ? "all" : "none"
  }

  parameter {
    name  = "log_min_duration_statement"
    value = var.environment == "production" ? "1000" : "-1"
  }

  parameter {
    name  = "shared_preload_libraries"
    value = "pg_stat_statements"
  }

  tags = {
    Name        = "ayvcodr-${var.environment}-postgres15"
    Environment = var.environment
    Project     = "AyvCodr"
  }
}

# CloudWatch Alarms for database monitoring
resource "aws_cloudwatch_metric_alarm" "database_cpu" {
  alarm_name          = "ayvcodr-${var.environment}-db-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "120"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors db cpu utilization"
  alarm_actions       = var.environment == "production" ? [aws_sns_topic.alerts[0].arn] : []

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }

  tags = {
    Name        = "ayvcodr-${var.environment}-db-cpu-alarm"
    Environment = var.environment
    Project     = "AyvCodr"
  }
}

resource "aws_cloudwatch_metric_alarm" "database_connections" {
  alarm_name          = "ayvcodr-${var.environment}-db-high-connections"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = "120"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors database connections"
  alarm_actions       = var.environment == "production" ? [aws_sns_topic.alerts[0].arn] : []

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }

  tags = {
    Name        = "ayvcodr-${var.environment}-db-connections-alarm"
    Environment = var.environment
    Project     = "AyvCodr"
  }
}

# SNS Topic for alerts (production only)
resource "aws_sns_topic" "alerts" {
  count = var.environment == "production" ? 1 : 0
  name  = "ayvcodr-${var.environment}-alerts"

  tags = {
    Name        = "ayvcodr-${var.environment}-alerts"
    Environment = var.environment
    Project     = "AyvCodr"
  }
}

# Store database credentials in AWS Systems Manager Parameter Store
resource "aws_ssm_parameter" "db_password" {
  name  = "/ayvcodr/${var.environment}/database/password"
  type  = "SecureString"
  value = random_password.db_password.result

  tags = {
    Environment = var.environment
    Project     = "AyvCodr"
  }
}

resource "aws_ssm_parameter" "db_username" {
  name  = "/ayvcodr/${var.environment}/database/username"
  type  = "String"
  value = aws_db_instance.main.username

  tags = {
    Environment = var.environment
    Project     = "AyvCodr"
  }
}

resource "aws_ssm_parameter" "db_host" {
  name  = "/ayvcodr/${var.environment}/database/host"
  type  = "String"
  value = aws_db_instance.main.endpoint

  tags = {
    Environment = var.environment
    Project     = "AyvCodr"
  }
}

# Outputs
output "endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main.endpoint
}

output "port" {
  description = "RDS instance port"
  value       = aws_db_instance.main.port
}

output "database_name" {
  description = "Database name"
  value       = aws_db_instance.main.db_name
}

output "username" {
  description = "Database username"
  value       = aws_db_instance.main.username
  sensitive   = true
}

output "connection_string" {
  description = "Database connection string"
  value       = "postgresql://${aws_db_instance.main.username}:${random_password.db_password.result}@${aws_db_instance.main.endpoint}:${aws_db_instance.main.port}/${aws_db_instance.main.db_name}"
  sensitive   = true
}