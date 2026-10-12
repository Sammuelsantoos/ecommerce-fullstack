#!/usr/bin/env bash
# Executado NA EC2 (via AWS SSM Run Command) pelo workflow cd-backend.yml.
# Uso: deploy.sh <image-uri> [aws-region]
set -euo pipefail

IMAGE="${1:?uso: deploy.sh <image-uri> [aws-region]}"
REGION="${2:-us-east-1}"
NAME="ecommerce-api"
ENV_FILE="/opt/ecommerce/api.env"
REGISTRY="${IMAGE%%/*}"

run_container() {
  docker run -d \
    --name "$NAME" \
    --restart unless-stopped \
    --env-file "$ENV_FILE" \
    -p 127.0.0.1:3000:3000 \
    "$1" >/dev/null
}

wait_healthy() {
  for _ in $(seq 1 30); do
    if curl -fsS http://127.0.0.1:3000/api/health >/dev/null 2>&1; then
      return 0
    fi
    sleep 2
  done
  return 1
}

echo ">> login no ECR ($REGISTRY)"
aws ecr get-login-password --region "$REGION" |
  docker login --username AWS --password-stdin "$REGISTRY"

echo ">> pull $IMAGE"
docker pull "$IMAGE"

# Guarda o ID da imagem atual para rollback
PREVIOUS_ID="$(docker inspect --format '{{.Image}}' "$NAME" 2>/dev/null || true)"

echo ">> substituindo container"
docker rm -f "$NAME" >/dev/null 2>&1 || true
run_container "$IMAGE"

if wait_healthy; then
  echo ">> deploy OK: $(curl -fsS http://127.0.0.1:3000/api/health)"
  docker image prune -f >/dev/null
  exit 0
fi

echo "!! health check falhou. Últimos logs:"
docker logs --tail 80 "$NAME" || true

if [ -n "$PREVIOUS_ID" ]; then
  echo ">> rollback para $PREVIOUS_ID"
  docker rm -f "$NAME" >/dev/null 2>&1 || true
  run_container "$PREVIOUS_ID"
  if wait_healthy; then
    echo ">> rollback concluído (versão anterior no ar)"
  else
    echo "!! rollback também falhou"
  fi
fi

exit 1
