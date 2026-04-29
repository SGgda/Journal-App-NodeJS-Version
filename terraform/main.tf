provider "aws" {
  region = var.aws_region
}

# Use the latest Ubuntu 22.04 LTS AMI
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }
}

# Create a security group
resource "aws_security_group" "journal_app_sg" {
  name        = "journal-app-sg-2"
  description = "Allow inbound traffic for Journal App (SSH, HTTP, Custom K8s Ports)"

  # SSH
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Frontend NodePort
  ingress {
    from_port   = 30000
    to_port     = 30000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Backend NodePort
  ingress {
    from_port   = 30005
    to_port     = 30005
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # K3s API server (for Jenkins remote kubectl access)
  ingress {
    from_port   = 6443
    to_port     = 6443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Egress - allow all outgoing traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# Create an EC2 instance
resource "aws_instance" "k3s_server" {
  ami           = data.aws_ami.ubuntu.id
  instance_type = "t3.small" # 2GB RAM to prevent K3s from crashing
  key_name      = var.key_name
  
  vpc_security_group_ids = [aws_security_group.journal_app_sg.id]

  # Install Docker and K3s
  user_data = <<-EOF
              #!/bin/bash
              apt-get update -y
              # Install Docker
              apt-get install -y apt-transport-https ca-certificates curl software-properties-common
              curl -fsSL https://download.docker.com/linux/ubuntu/gpg | apt-key add -
              add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
              apt-get update -y
              apt-get install -y docker-ce docker-ce-cli containerd.io
              usermod -aG docker ubuntu

              # Install K3s (lightweight Kubernetes)
              curl -sfL https://get.k3s.io | sh -
              
              # Set up kubeconfig for ubuntu user
              mkdir -p /home/ubuntu/.kube
              cp /etc/rancher/k3s/k3s.yaml /home/ubuntu/.kube/config
              chown -R ubuntu:ubuntu /home/ubuntu/.kube
              EOF

  tags = {
    Name = "Journal-App-K3s"
  }
}

output "public_ip" {
  value = aws_instance.k3s_server.public_ip
}
