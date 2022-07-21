---
title: "Kubernetes Load-Balancer service"
weight: 51
description: >
  Specific use cases for kube-vip.
---

When the services are enabled for kube-vip a "watcher" is enabled on all services that match the type `loadBalancer`. The "watcher" will only advertise a kubernetes service once the `spec.loadBalancerIP` has been populated, which is the role performed by a cloud controller. Additionally kube-vip may ignore or act upon a service depending on various annotations.

## Configure kube-vip to ignore a service

To configure kube-vip to ignore a service add add an `Annotation` of `kube-vip.io/ignore=true` in the `svc.Metadata.Annotations`

## Kubernetes LoadBalancer Class (Kubernetes v1.24+)

The watcher in kube-vip (v0.5.0+) will always examine the [load balancer class ](https://kubernetes.io/docs/concepts/services-networking/service/#load-balancer-class), and if it isn't set then will assume that classes aren'y being set and act upon the service. If the `svc.Spec.LoadBalancerClass` has been set in the service spec then kube-vip will only act **IF** the spec has been set to:

`svc.Spec.LoadBalancerClass`=`kube-vip.io/kube-vip-class`. 

## Multiple services on the same IP

It is entirely possible for multiple services to share the same IP, as long as the exposed port is unique.

The below example will create two load balancer services that listen on the same ip `192.168.0.220` but expose port `80` & `81`.
```
$ kubectl expose deployment deployment \
    --port=80 --target-port=80 \
    --type=LoadBalancer --name http1 \
    --load-balancer-ip=192.168.0.220
service/nginx1 exposed

$ kubectl expose deployment deployment \
    --port=81 --target-port=80 \
    --type=LoadBalancer --name http2 \
    --load-balancer-ip=192.168.0.220
service/nginx2 exposed
```