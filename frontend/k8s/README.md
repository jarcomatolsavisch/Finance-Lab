Run the platform on minikube

1. Run a minikube cluster

```
minikube start
```

2. Point your shell to minikube's Docker daemon

```
eval $(minikube docker-env)
```

3. Build the image inside minikube's daemon

```
docker build -t app-platform:latest .
```

4. Apply the deployment manifest

```
kubectl apply -f k8s/deployment.yaml
```

5. check its url

```
minikube service app-platform
|-----------|--------------|-------------|---------------------------|
| NAMESPACE |     NAME     | TARGET PORT |            URL            |
|-----------|--------------|-------------|---------------------------|
| default   | app-platform |        8000 | http://192.168.49.2:30000 |
|-----------|--------------|-------------|---------------------------|
🏃  Starting tunnel for service app-platform.
|-----------|--------------|-------------|------------------------|
| NAMESPACE |     NAME     | TARGET PORT |          URL           |
|-----------|--------------|-------------|------------------------|
| default   | app-platform |             | http://127.0.0.1:57286 |
|-----------|--------------|-------------|------------------------|
🎉  Opening service default/app-platform in default browser...
❗  Because you are using a Docker driver on darwin, the terminal needs to be open to run it.
```
