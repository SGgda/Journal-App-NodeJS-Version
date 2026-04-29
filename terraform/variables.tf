variable "aws_region" {
  description = "AWS Region to deploy to"
  default     = "ap-south-1"
}

variable "key_name" {
  description = "Name of an existing AWS KeyPair to enable SSH access to the instance"
  type        = string
}
