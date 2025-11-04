# CI/CD Integration Guide for WebSee MCP Evaluation

This guide provides comprehensive instructions for integrating the WebSee MCP evaluation framework into various CI/CD platforms.

## Table of Contents

1. [GitHub Actions](#github-actions)
2. [GitLab CI/CD](#gitlab-cicd)
3. [CircleCI](#circleci)
4. [Jenkins](#jenkins)
5. [Azure Pipelines](#azure-pipelines)
6. [Travis CI](#travis-ci)
7. [Custom Integration](#custom-integration)

---

## GitHub Actions

### Basic Workflow

Create `.github/workflows/mcp-evaluation.yml`:

```yaml
name: WebSee MCP Evaluation

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]
  schedule:
    # Run daily at 2 AM UTC
    - cron: '0 2 * * *'

jobs:
  evaluate:
    name: Run MCP Evaluation
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium

      - name: Build project
        run: npm run build

      - name: Run MCP evaluation
        id: evaluation
        run: |
          npm run eval
          echo "EVAL_RESULT=$?" >> $GITHUB_OUTPUT
        continue-on-error: true

      - name: Upload evaluation report
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: evaluation-report-${{ github.sha }}
          path: eval/evaluation-report-*.json
          retention-days: 30

      - name: Comment PR with results
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const reportFiles = fs.readdirSync('eval').filter(f => f.startsWith('evaluation-report-'));

            if (reportFiles.length > 0) {
              const reportPath = `eval/${reportFiles[0]}`;
              const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

              const comment = `
              ## 🧪 WebSee MCP Evaluation Results

              **Overall Score:** ${report.scorePercentage.toFixed(1)}%
              **Tests Passed:** ${report.passedTests}/${report.totalTests}
              **Average Response Time:** ${report.averageResponseTime.toFixed(0)}ms

              ### Category Breakdown
              ${Object.entries(report.categoryBreakdown).map(([cat, stats]) => {
                const pct = (stats.score / stats.maxScore) * 100;
                return `- **${cat}:** ${pct.toFixed(1)}% (${stats.passed}/${stats.passed + stats.failed} passed)`;
              }).join('\n')}

              ### Performance Metrics
              ${report.performanceMetrics.map(m =>
                `- **${m.toolName}:** ${m.averageTime.toFixed(0)}ms avg, ${m.successRate.toFixed(1)}% success`
              ).join('\n')}
              `;

              github.rest.issues.createComment({
                issue_number: context.issue.number,
                owner: context.repo.owner,
                repo: context.repo.repo,
                body: comment
              });
            }

      - name: Check evaluation threshold
        if: steps.evaluation.outputs.EVAL_RESULT != '0'
        run: |
          echo "❌ MCP evaluation failed to meet thresholds"
          exit 1
```

### Advanced Workflow with Matrix Testing

```yaml
name: WebSee MCP Evaluation Matrix

on: [push, pull_request]

jobs:
  evaluate:
    name: Evaluate on ${{ matrix.os }} with Node ${{ matrix.node }}
    runs-on: ${{ matrix.os }}

    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
        node: ['18', '20']
      fail-fast: false

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js ${{ matrix.node }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node }}
          cache: 'npm'

      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run build
      - run: npm run eval

      - name: Upload results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: results-${{ matrix.os }}-node${{ matrix.node }}
          path: eval/evaluation-report-*.json
```

---

## GitLab CI/CD

Create `.gitlab-ci.yml`:

```yaml
stages:
  - build
  - test
  - evaluate
  - report

variables:
  NODE_VERSION: "18"

build:
  stage: build
  image: node:${NODE_VERSION}
  cache:
    paths:
      - node_modules/
  script:
    - npm ci
    - npm run build
  artifacts:
    paths:
      - dist/
      - node_modules/
    expire_in: 1 hour

evaluate:mcp:
  stage: evaluate
  image: mcr.microsoft.com/playwright:v1.49.0-jammy
  dependencies:
    - build
  script:
    - npm run eval
  artifacts:
    when: always
    paths:
      - eval/evaluation-report-*.json
    reports:
      junit: eval/evaluation-report-*.json
    expire_in: 30 days
  allow_failure: true

report:dashboard:
  stage: report
  image: node:${NODE_VERSION}
  dependencies:
    - evaluate:mcp
  script:
    - |
      cat <<EOF > eval-summary.md
      # MCP Evaluation Summary

      Build: ${CI_PIPELINE_ID}
      Commit: ${CI_COMMIT_SHORT_SHA}
      Branch: ${CI_COMMIT_BRANCH}

      See artifacts for detailed report.
      EOF
    - cat eval-summary.md
  artifacts:
    paths:
      - eval-summary.md
```

---

## CircleCI

Create `.circleci/config.yml`:

```yaml
version: 2.1

orbs:
  node: circleci/node@5.1.0
  browser-tools: circleci/browser-tools@1.4.0

jobs:
  evaluate:
    docker:
      - image: mcr.microsoft.com/playwright:v1.49.0-jammy
    steps:
      - checkout

      - node/install:
          node-version: '18'

      - node/install-packages:
          pkg-manager: npm

      - run:
          name: Install Playwright browsers
          command: npx playwright install chromium

      - run:
          name: Build project
          command: npm run build

      - run:
          name: Run MCP evaluation
          command: npm run eval

      - store_artifacts:
          path: eval/evaluation-report-*.json
          destination: evaluation-reports

      - store_test_results:
          path: eval

workflows:
  evaluate-mcp:
    jobs:
      - evaluate:
          filters:
            branches:
              only:
                - main
                - develop
```

---

## Jenkins

Create `Jenkinsfile`:

```groovy
pipeline {
    agent {
        docker {
            image 'mcr.microsoft.com/playwright:v1.49.0-jammy'
            args '-u root:root'
        }
    }

    environment {
        NODE_VERSION = '18'
    }

    stages {
        stage('Setup') {
            steps {
                sh 'npm ci'
                sh 'npx playwright install chromium'
            }
        }

        stage('Build') {
            steps {
                sh 'npm run build'
            }
        }

        stage('Evaluate MCP') {
            steps {
                sh 'npm run eval || true'
            }
            post {
                always {
                    archiveArtifacts artifacts: 'eval/evaluation-report-*.json', fingerprint: true

                    script {
                        def reportFile = sh(
                            script: "ls -t eval/evaluation-report-*.json | head -1",
                            returnStdout: true
                        ).trim()

                        if (reportFile) {
                            def report = readJSON file: reportFile

                            currentBuild.description = """
                            Score: ${report.scorePercentage}%
                            Passed: ${report.passedTests}/${report.totalTests}
                            Avg Time: ${report.averageResponseTime}ms
                            """.stripIndent()
                        }
                    }
                }
            }
        }

        stage('Publish Results') {
            steps {
                publishHTML([
                    allowMissing: false,
                    alwaysLinkToLastBuild: true,
                    keepAll: true,
                    reportDir: 'eval',
                    reportFiles: 'evaluation-report-*.json',
                    reportName: 'MCP Evaluation Report'
                ])
            }
        }
    }

    post {
        success {
            echo '✅ MCP evaluation completed successfully'
        }
        failure {
            echo '❌ MCP evaluation failed'
        }
        always {
            cleanWs()
        }
    }
}
```

---

## Azure Pipelines

Create `azure-pipelines.yml`:

```yaml
trigger:
  branches:
    include:
      - main
      - develop

pool:
  vmImage: 'ubuntu-latest'

variables:
  nodeVersion: '18.x'

stages:
  - stage: Build
    jobs:
      - job: BuildAndTest
        steps:
          - task: NodeTool@0
            inputs:
              versionSpec: $(nodeVersion)
            displayName: 'Install Node.js'

          - script: |
              npm ci
              npx playwright install --with-deps chromium
            displayName: 'Install dependencies'

          - script: npm run build
            displayName: 'Build project'

          - script: npm run eval
            displayName: 'Run MCP evaluation'
            continueOnError: true

          - task: PublishBuildArtifacts@1
            inputs:
              PathtoPublish: 'eval'
              ArtifactName: 'evaluation-reports'
              publishLocation: 'Container'
            displayName: 'Publish evaluation reports'
            condition: always()

          - task: PublishTestResults@2
            inputs:
              testResultsFormat: 'JUnit'
              testResultsFiles: 'eval/evaluation-report-*.json'
              failTaskOnFailedTests: false
            displayName: 'Publish test results'
            condition: always()
```

---

## Travis CI

Create `.travis.yml`:

```yaml
language: node_js

node_js:
  - '18'

addons:
  apt:
    packages:
      - libwoff1
      - libopus0
      - libwebp7
      - libwebpdemux2
      - libenchant-2-2
      - libgudev-1.0-0
      - libsecret-1-0
      - libhyphen0
      - libgdk-pixbuf2.0-0
      - libegl1
      - libnotify4
      - libxslt1.1
      - libevent-2.1-7
      - libgles2
      - libxcomposite1
      - libatk1.0-0
      - libatk-bridge2.0-0
      - libepoxy0
      - libgtk-3-0
      - libharfbuzz-icu0

cache:
  npm: true
  directories:
    - node_modules

install:
  - npm ci
  - npx playwright install chromium

script:
  - npm run build
  - npm run eval || travis_terminate 0

after_script:
  - ls -la eval/

deploy:
  provider: pages
  skip_cleanup: true
  github_token: $GITHUB_TOKEN
  local_dir: eval
  on:
    branch: main
```

---

## Custom Integration

### Docker-based Evaluation

Create `docker-compose.eval.yml`:

```yaml
version: '3.8'

services:
  mcp-evaluator:
    build:
      context: .
      dockerfile: Dockerfile.eval
    volumes:
      - ./eval:/app/eval
    environment:
      - CI=true
      - NODE_ENV=test
    command: npm run eval
```

Create `Dockerfile.eval`:

```dockerfile
FROM mcr.microsoft.com/playwright:v1.49.0-jammy

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

CMD ["npm", "run", "eval"]
```

Run with:
```bash
docker-compose -f docker-compose.eval.yml up
```

### Shell Script Integration

Create `scripts/run-evaluation.sh`:

```bash
#!/bin/bash

set -e

echo "🧪 Starting WebSee MCP Evaluation..."

# Setup
npm ci
npx playwright install --with-deps chromium
npm run build

# Run evaluation
if npm run eval; then
    echo "✅ Evaluation passed"
    EXIT_CODE=0
else
    echo "❌ Evaluation failed"
    EXIT_CODE=1
fi

# Parse and display results
REPORT=$(ls -t eval/evaluation-report-*.json | head -1)

if [ -f "$REPORT" ]; then
    echo ""
    echo "📊 Evaluation Summary:"
    echo "====================="

    SCORE=$(cat "$REPORT" | grep -o '"scorePercentage":[0-9.]*' | cut -d: -f2)
    PASSED=$(cat "$REPORT" | grep -o '"passedTests":[0-9]*' | cut -d: -f2)
    TOTAL=$(cat "$REPORT" | grep -o '"totalTests":[0-9]*' | cut -d: -f2)

    echo "Score: ${SCORE}%"
    echo "Passed: ${PASSED}/${TOTAL}"
    echo ""

    # Upload to artifact storage (example)
    if [ -n "$ARTIFACT_URL" ]; then
        curl -X POST -F "file=@$REPORT" "$ARTIFACT_URL"
    fi
fi

exit $EXIT_CODE
```

Make it executable:
```bash
chmod +x scripts/run-evaluation.sh
```

---

## Best Practices

### 1. Caching Dependencies

Always cache `node_modules` to speed up builds:

```yaml
# GitHub Actions
- uses: actions/cache@v3
  with:
    path: node_modules
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}

# GitLab CI
cache:
  paths:
    - node_modules/
  key: ${CI_COMMIT_REF_SLUG}
```

### 2. Parallel Execution

Run tests in parallel when possible:

```yaml
# GitHub Actions Matrix
strategy:
  matrix:
    category: [
      'Component Debugging',
      'Network Analysis',
      'Error Resolution',
      'Bundle Analysis'
    ]
```

### 3. Failure Handling

Set appropriate thresholds:

```typescript
// In CI mode
const MINIMUM_SCORE = 70;
const report = await runEvaluation();

if (report.scorePercentage < MINIMUM_SCORE) {
  process.exit(1);
}
```

### 4. Report Retention

Keep reports for historical analysis:

```yaml
artifacts:
  expire_in: 30 days  # GitLab
  retention-days: 30   # GitHub Actions
```

### 5. Notifications

Set up notifications for failures:

```yaml
# GitHub Actions
- name: Notify on failure
  if: failure()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    text: 'MCP evaluation failed'
```

---

## Monitoring and Dashboards

### Grafana Integration

Export metrics in Prometheus format:

```typescript
// Add to evaluation.ts
export function exportPrometheusMetrics(report: EvaluationReport): string {
  return `
# HELP websee_mcp_score_percentage Overall evaluation score percentage
# TYPE websee_mcp_score_percentage gauge
websee_mcp_score_percentage ${report.scorePercentage}

# HELP websee_mcp_tests_passed Number of tests passed
# TYPE websee_mcp_tests_passed gauge
websee_mcp_tests_passed ${report.passedTests}

# HELP websee_mcp_avg_response_time Average response time in ms
# TYPE websee_mcp_avg_response_time gauge
websee_mcp_avg_response_time ${report.averageResponseTime}
  `.trim();
}
```

### Custom Dashboard

Create a simple HTML dashboard:

```bash
npm run eval
node scripts/generate-dashboard.js
```

---

## Troubleshooting

### Common Issues

**Browser installation fails:**
```bash
# Use official Playwright Docker image
FROM mcr.microsoft.com/playwright:v1.49.0-jammy
```

**Out of memory errors:**
```yaml
# Increase Node.js memory
NODE_OPTIONS: --max-old-space-size=4096
```

**Timeout issues:**
```typescript
// Increase timeouts in test cases
performanceBenchmark: {
  maxResponseTime: 10000,  // 10 seconds
  expectedAccuracy: 85
}
```

---

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitLab CI/CD Documentation](https://docs.gitlab.com/ee/ci/)
- [Playwright CI Guide](https://playwright.dev/docs/ci)
- [MCP SDK Documentation](https://modelcontextprotocol.io)

---

**Last Updated:** 2025-10-26
**Version:** 1.0.0
