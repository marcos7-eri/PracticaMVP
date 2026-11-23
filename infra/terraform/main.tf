terraform {
  required_version = ">= 1.6.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  backend "s3" {}
}
provider "aws" {
  region = var.aws_region
}
variable "aws_region" {
  type    = string
  default = "us-east-1"
}
variable "ssh_public_key" {
  type      = string
  sensitive = true
}
variable "ssh_cidr" {
  type    = string
  default = "0.0.0.0/0"
}
resource "aws_vpc" "parking" {
  cidr_block = "10.42.0.0/16"
  tags       = { Name = "parking-vpc" }
}
resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.parking.id
  cidr_block              = "10.42.1.0/24"
  map_public_ip_on_launch = true
  availability_zone       = "${var.aws_region}a"
  tags                    = { Name = "parking-public" }
}
resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.parking.id
}
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.parking.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }
}
resource "aws_route_table_association" "public" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public.id
}
resource "aws_security_group" "web" {
  name   = "parking-web"
  vpc_id = aws_vpc.parking.id
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.ssh_cidr]
  }
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"]
  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-*"]
  }
  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}
resource "aws_key_pair" "deploy" {
  key_name   = "parking-deploy"
  public_key = var.ssh_public_key
}
resource "aws_instance" "app" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = "t3.micro"
  subnet_id              = aws_subnet.public.id
  vpc_security_group_ids = [aws_security_group.web.id]
  key_name               = aws_key_pair.deploy.key_name
  root_block_device {
    volume_size = 16
    volume_type = "gp3"
  }
  tags = { Name = "parking-mvp" }
}
resource "aws_eip" "app" {
  domain     = "vpc"
  instance   = aws_instance.app.id
  depends_on = [aws_internet_gateway.igw]
}
output "public_ip" {
  value = aws_eip.app.public_ip
}
