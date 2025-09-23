docker-compose down
docker system prune -a --volumes
docker builder prune -a
docker volume prune -f
docker network prune -f
