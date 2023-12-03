---
title: "KinD"
weight: 56
description: >
  kube-vip usage on KinD.
---

## Deploying KIND

The documentation for KIND is fantastic and its [quick start](https://kind.sigs.k8s.io/docs/user/quick-start/) guide will have you up and running in no time.

## Find Address Pool for kube-vip

We will need to find addresses that can be used by kube-vip:

```sh
docker network inspect kind -f '{{ range $i, $a := .IPAM.Config }}{{ println .Subnet }}{{ end }}'
```

This will return a CIDR range such as `172.18.0.0/16` and from here we can select a range.

## Deploy the kube-vip Cloud Controller

```sh
kubectl apply -f https://raw.githubusercontent.com/kube-vip/kube-vip-cloud-provider/main/manifest/kube-vip-cloud-controller.yaml
```

## Add our Address range

```sh
kubectl create configmap --namespace kube-system kubevip --from-literal range-global=172.18.100.10-172.18.100.30
```

## Install kube-vip

## Create RBAC settings

 ```
 kubectl apply -f https://kube-vip.io/manifests/rbac.yaml
 ```

### Get latest version

We can parse the GitHub API to find the latest version (or we can set this manually)

`KVVERSION=$(curl -sL https://api.github.com/repos/kube-vip/kube-vip/releases | jq -r ".[0].name")`

or manually:

`export KVVERSION=vx.x.x`

The easiest method to generate a manifest is using the container itself, below will create an alias for different container runtimes.

### containerd

`alias kube-vip="ctr image pull ghcr.io/kube-vip/kube-vip:$KVVERSION; ctr run --rm --net-host ghcr.io/kube-vip/kube-vip:$KVVERSION vip /kube-vip"`

### Docker

`alias kube-vip="docker run --network host --rm ghcr.io/kube-vip/kube-vip:$KVVERSION"`

## Deploy kube-vip as a DaemonSet

```sh
kube-vip manifest daemonset --services --inCluster --arp --interface eth0 | kubectl apply -f -
```

## Test

```sh
kubectl apply -f https://k8s.io/examples/application/deployment.yaml
```

```sh
kubectl expose deployment nginx-deployment --port=80 --type=LoadBalancer --name=nginx
```

```sh
kubectl get svc
NAME         TYPE           CLUSTER-IP      EXTERNAL-IP     PORT(S)        AGE
kubernetes   ClusterIP      10.96.0.1       <none>          443/TCP        74m
nginx        LoadBalancer   10.96.196.235   172.18.100.11   80:31236/TCP   6s
```
