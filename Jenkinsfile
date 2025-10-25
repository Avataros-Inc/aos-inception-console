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
        stage('Checkout') {
            steps {
                script {
                    // Checkout code with submodules
                    checkout([
                        $class: 'GitSCM',
                        branches: scm.branches,
                        extensions: [
                            [$class: 'SubmoduleOption',
                             disableSubmodules: false,
                             parentCredentials: true,
                             recursiveSubmodules: true,
                             trackingSubmodules: false]
                        ],
                        userRemoteConfigs: scm.userRemoteConfigs
                    ])
                }
            }
        }

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
        
        stage('Build Docker Image') {
            steps {
                script {
                    sh "docker build -t ${DOCKER_REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG} ."
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