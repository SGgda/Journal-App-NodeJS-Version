pipeline {
    agent any
    
    triggers {
        pollSCM('* * * * *')
    }

    environment {
        DOCKERHUB_CREDENTIALS = credentials('dockerhub')
        IMAGE_FRONTEND = "sloth69/journal-frontend"
        IMAGE_BACKEND = "sloth69/journal-backend"
        TAG = "${env.BUILD_NUMBER}"
        PATH = "/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
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
                    sh 'docker build --platform linux/amd64 --build-arg VITE_API_URL=http://43.205.198.97:30005/api -t $IMAGE_FRONTEND:$TAG .'
                    sh 'docker tag $IMAGE_FRONTEND:$TAG $IMAGE_FRONTEND:latest'
                }
            }
        }

        stage('Build Backend Image') {
            steps {
                dir('backend') {
                    sh 'docker build --platform linux/amd64 -t $IMAGE_BACKEND:$TAG .'
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
                    sh 'kubectl --kubeconfig=$KUBECONFIG --validate=false apply -f k8s/redis-deployment.yaml'
                    sh 'kubectl --kubeconfig=$KUBECONFIG --validate=false apply -f k8s/backend-deployment.yaml'
                    sh 'kubectl --kubeconfig=$KUBECONFIG --validate=false apply -f k8s/frontend-deployment.yaml'
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
