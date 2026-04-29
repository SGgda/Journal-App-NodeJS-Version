pipeline {
    agent any

    environment {
        DOCKERHUB_CREDENTIALS = credentials('dockerhub-creds')
        KUBECONFIG_CREDENTIALS = credentials('kubeconfig')
        IMAGE_FRONTEND = "sloth69/journal-frontend"
        IMAGE_BACKEND = "sloth69/journal-backend"
        TAG = "${env.BUILD_NUMBER}"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Frontend Image') {
            steps {
                dir('frontend') {
                    sh 'docker build -t $IMAGE_FRONTEND:$TAG .'
                    sh 'docker tag $IMAGE_FRONTEND:$TAG $IMAGE_FRONTEND:latest'
                }
            }
        }

        stage('Build Backend Image') {
            steps {
                dir('backend') {
                    sh 'docker build -t $IMAGE_BACKEND:$TAG .'
                    sh 'docker tag $IMAGE_BACKEND:$TAG $IMAGE_BACKEND:latest'
                }
            }
        }

        stage('Push Docker Images') {
            steps {
                sh 'echo $DOCKERHUB_CREDENTIALS_PSW | docker login -u $DOCKERHUB_CREDENTIALS_USR --password-stdin'
                sh 'docker push $IMAGE_FRONTEND:$TAG'
                sh 'docker push $IMAGE_FRONTEND:latest'
                sh 'docker push $IMAGE_BACKEND:$TAG'
                sh 'docker push $IMAGE_BACKEND:latest'
            }
        }

        stage('Deploy to K3s') {
            steps {
                withCredentials([file(credentialsId: 'kubeconfig', variable: 'KUBECONFIG')]) {
                    sh 'kubectl --kubeconfig=$KUBECONFIG apply -f k8s/redis-deployment.yaml'
                    sh 'kubectl --kubeconfig=$KUBECONFIG apply -f k8s/backend-deployment.yaml'
                    sh 'kubectl --kubeconfig=$KUBECONFIG apply -f k8s/frontend-deployment.yaml'
                    
                    // Force rollout to pick up latest image
                    sh 'kubectl --kubeconfig=$KUBECONFIG rollout restart deployment/frontend'
                    sh 'kubectl --kubeconfig=$KUBECONFIG rollout restart deployment/backend'
                }
            }
        }
    }
    
    post {
        always {
            sh 'docker logout'
        }
    }
}
