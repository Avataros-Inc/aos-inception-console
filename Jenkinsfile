pipeline {
    agent any
    options {
        buildDiscarder(logRotator(numToKeepStr: '5', daysToKeepStr: '7'))
    } 
    environment {
        // Define your Docker registry URL and credentials ID in Jenkins
        DOCKER_REGISTRY = 'git.avataros.xyz'
        GIT_CREDENTIALS_ID = 'gitjenkins'
        IMAGE_NAME = "avataros/aos-inception-console"
        IMAGE_TAG = "${env.GIT_COMMIT.substring(0, 8)}-${env.BUILD_NUMBER}" // Using BUILD_ID for unique tags
        FULL_IMAGE_NAME_AND_TAG = "${DOCKER_REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}"
    }

    stages {
        stage('Verify Docker Installation') {
            steps {
                script {
                    // Check if Docker is available
                    def dockerAvailable = sh(script: 'which docker || command -v docker', returnStatus: true) == 0
                    
                    if (!dockerAvailable) {
                        error 'Docker is not available. Please ensure Docker is pre-installed on this agent or use a different agent with Docker installed.'
                    }
                    
                    // Verify Docker is working
                    sh 'docker --version'
                }
            }
        }   
        
        stage('Build Docker Image with Tests') {
            steps {
                script {
                    // Build with tests integrated in Docker multi-stage build
                    // Tests will run as part of the Docker build process
                    sh "docker build -t ${DOCKER_REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG} ."
                    
                    // Extract test results and coverage from Docker image for archiving
                    sh """
                        # Create a temporary container to extract test results if they exist
                        if docker run --rm --name temp-test-extract ${DOCKER_REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG} test -d /test-results 2>/dev/null; then
                            echo "Extracting test results..."
                            docker run --rm -v \${PWD}/test-results:/host-results ${DOCKER_REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG} \
                                sh -c 'cp -r /test-results/* /host-results/ 2>/dev/null || echo "No test results to copy"'
                        else
                            echo "No test results found in container"
                        fi
                    """
                }
            }
            post {
                always {
                    // Archive test results if they exist
                    archiveArtifacts artifacts: 'test-results/**/*', allowEmptyArchive: true
                    // Also try to archive coverage specifically
                    archiveArtifacts artifacts: 'coverage/**/*', allowEmptyArchive: true
                }
            }
        }

        stage('Login to Gitea Container Registry') {
            steps {
                script {
                    withCredentials([usernamePassword(
                        credentialsId: "${GIT_CREDENTIALS_ID}", 
                        passwordVariable: 'GIT_PASSWORD', 
                        usernameVariable: 'GIT_USERNAME'
                    )]) {
                        sh "echo ${GIT_PASSWORD} | docker login ${DOCKER_REGISTRY} -u ${GIT_USERNAME} --password-stdin"
                    }
                }
            }
        }

        stage('Push Docker Image') {
            steps {
                script {
                    sh "docker push ${DOCKER_REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}"
                }
            }
        }

        stage('Deploy') {
            steps {
                echo "Image to deploy: ${DOCKER_REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}"
            }
        }
    }

    post {
        always {
            cleanWs()
        }
        success {
            echo 'Pipeline finished successfully!'
        }
        failure {
            echo 'Pipeline failed!'
        }
    }
}