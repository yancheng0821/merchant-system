variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ca-central-1"
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "merchant-system"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "prod"
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}