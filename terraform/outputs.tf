output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "private_subnets" {
  description = "Private subnet IDs"
  value       = module.vpc.private_subnets
}

output "cluster_endpoint" {
  description = "EKS cluster endpoint"
  value       = module.eks.cluster_endpoint
}

output "cluster_name" {
  description = "EKS cluster name"
  value       = module.eks.cluster_name
}

output "efs_file_system_id" {
  description = "EFS File System ID"
  value       = aws_efs_file_system.shared_storage.id
}

output "efs_avatars_access_point_id" {
  description = "EFS Avatars Access Point ID"
  value       = aws_efs_access_point.avatars.id
}

output "efs_uploads_access_point_id" {
  description = "EFS Uploads Access Point ID"
  value       = aws_efs_access_point.uploads.id
}

output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.mysql.endpoint
}

output "redis_endpoint" {
  description = "ElastiCache Redis endpoint"
  value       = aws_elasticache_cluster.redis.cache_nodes[0].address
}

output "ecr_repositories" {
  description = "ECR repository URLs"
  value = {
    for k, v in aws_ecr_repository.repos : k => v.repository_url
  }
}