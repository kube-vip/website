---
title: "Kubernetes Load-Balancer service"
weight: 51
description: >
  Kubernetes services options
---

When the services are enabled for kube-vip a [watcher](https://kubernetes.io/docs/reference/using-api/api-concepts/#efficient-detection-of-changes) is enabled on all services that match the type `loadBalancer`. The "watcher" will only advertise a kubernetes service once the `metadata.annotations["kube-vip.io/loadbalancerIPs"]`(Since kube-vip 0.5.12) or `spec.loadBalancerIP` has been populated, which is the role performed by a cloud controller. Additionally kube-vip may ignore or act upon a service depending on various annotations.

## Configure kube-vip to ignore a service

To configure kube-vip to ignore a service add a `kube-vip.io/ignore=true` annotation in the `metadata.annotations`

## Kubernetes LoadBalancer Class (Kubernetes v1.24+) (kube-vip v0.5.0+)

The watcher will always examine the [load balancer class ](https://kubernetes.io/docs/concepts/services-networking/service/#load-balancer-class), and if it isn't set then will assume that classes aren't being set and act upon the service. If the `spec.loadBalancerClass` has been set in the service spec then kube-vip will only act **IF** the spec has been set to:

`spec.loadBalancerClass`=`kube-vip.io/kube-vip-class`.

## Multiple services on the same IP

It is entirely possible for multiple services to share the same IP, as long as the exposed port is unique.

The below example will create two load balancer services that listen on the same ip `192.168.0.220` but expose port `80` & `81`.
```
$ kubectl expose deployment test-deploy \
    --port=80 --target-port=80 \
    --type=LoadBalancer --name http1 \
    --load-balancer-ip=192.168.0.220
service/http1 exposed

$ kubectl expose deployment test-deploy \
    --port=81 --target-port=80 \
    --type=LoadBalancer --name http2 \
    --load-balancer-ip=192.168.0.220
service/http2 exposed
```

## Load Balancing Load Balancers (when using ARP mode, yes you read that correctly) (kube-vip v0.5.0+)

By default ARP mode provides a HA implementation of a VIP (your service IP address) which will receive traffic on the kube-vip leader. This leader kube-vip instance will then drop traffic onto the kube-proxy managed services network and load-balance it to one of the pods under the service. Whilst this method works and has been used for years in a variety of implementations it has a severe limitation that all services and their traffic are ultimately pinned to a single node, which has been elected as the leader. This will eventually produce a bottleneck or large failure domain whenever this node needs downtime. To circumvent this kube-vip has implemented a new function which is "leader election per service", instead of one node becoming the leader for **all** services an election is held across all kube-vip instances and the leader from that election becomes the holder of that service. Ultimately, this means that every service can end up on a different node when it is created in theory preventing a bottleneck in the initial deployment.

The kube-vip `yaml` will require the following:

```yaml
- name: enableServicesElection
  value: "true"
```

## External traffic policy (kube-vip v0.5.0+)

By default Kubernetes will use the policy `cluster` as the policy for all traffic that is external coming into the cluster. What this means is that as traffic enters the Kubernetes cluster through the load balancer address it is then placed on the service networking managed by kube-proxy where it is then NAT'd and directed to one of the pods anywhere within the cluster. This mode is fantastic as it automatically sends traffic to a pod regardless of where it is running inside the cluster and the end-user is normally non-the-wiser. However there are issues that this policy can create, namely source IP address presevation or direct access to pods etc. For more information consult the [Kubernetes documentation](https://kubernetes.io/docs/tasks/access-application-cluster/create-external-load-balancer/#preserving-the-client-source-ip)

In order for the `local` traffic policy to work a load balancer services VIP needs to be exposed from a node that has one of the pods that is part of that service. This is because the traffic will go direct to that pod and **not** onto the services network ensuring that the source IP address is preserved.

In kube-vip a service can be created with the `local` traffic policy, if the `enableServicesElection` has been **enabled**. This is because when this service is created kube-vip will only allow nodes that have a local pod instance running to participate in the leaderElection.

Example for exposing an nginx deployment:
```yaml
apiVersion: v1
kind: Service
metadata:
  name: nginx-service
spec:
  selector:
    app: nginx
  ports:
    - port: 80
      targetPort: 80
  externalTrafficPolicy: Local
  type: LoadBalancer
```

## Using DHCP for Load Balancers (experimental) (kube-vip v0.2.1+)


With kube-vip > 0.2.1, it is possible to use the local network DHCP server to provide kube-vip with a load balancer address that can be used to access a Kubernetes service on the network.

In order to do this, we need to signify to kube-vip and the cloud provider that we don't need one of their managed addresses. We do this by explicitly exposing a Service on the address `0.0.0.0`. When kube-vip sees a Service on this address, it will create a `macvlan` interface on the host and request a DHCP address. Once this address is provided, it will assign it as the `LoadBalancer` IP and update the Kubernetes Service.

```sh
$ kubectl expose deployment nginx-deployment --port=80 --type=LoadBalancer --name=nginx-dhcp --load-balancer-ip=0.0.0.0; kubectl get svc
service/nginx-dhcp exposed
NAME         TYPE           CLUSTER-IP      EXTERNAL-IP     PORT(S)        AGE
kubernetes   ClusterIP      10.96.0.1       <none>          443/TCP        17m
nginx-dhcp   LoadBalancer   10.97.150.208   0.0.0.0         80:31184/TCP   0s

{ ... a second or so later ... }

$ kubectl get svc
NAME         TYPE           CLUSTER-IP      EXTERNAL-IP     PORT(S)        AGE
kubernetes   ClusterIP      10.96.0.1       <none>          443/TCP        17m
nginx-dhcp   LoadBalancer   10.97.150.208   192.168.0.155   80:31184/TCP   3s
```
### DCHP hostname support

You can also specify a hostname used for the DHCP lease by adding an annotation to your service.

 ```
 apiVersion: v1
 kind: Service
 metadata:
   name: nginx-dhcp
   annotations:
     kube-vip.io/loadbalancerHostname: mydhcp-test
 spec:
   loadBalancerIP: 0.0.0.0
   ports:
   - name: http
     port: 80
     protocol: TCP
     targetPort: 80
   selector:
     app: hello-world
   type: LoadBalancer
 ```


## Using UPnP to expose a Service to the outside world

With kube-vip > 0.2.1, it is possible to expose a Service of type `LoadBalancer` on a specific port to the Internet by using UPnP (on a supported gateway).

Most simple networks look something like the following:

`<----- <internal network 192.168.0.0/24> <Gateway / router> <external network address> ----> Internet`

Using UPnP we can create a matching port on the `<external network address>` allowing your Service to be exposed to the Internet.

### Enable UPnP

Add the following to the kube-vip `env:` section of either the static Pod or DaemonSet for kube-vip, and the rest should be completely automated.

**Note** some environments may require (Unifi) `Secure mode` being `disabled` (this allows a host with a different address to register a port).

```yaml
- name: enableUPNP
  value: "true"
```

### Exposing a Service with UPnP

To expose a port successfully, we'll need to change the command slightly:

`--target-port=80` the port of the application in the pods (HTT/NGINX)
`--port=32380` the port the Service will be exposed on (and what you should connect to in order to receive traffic from the Service)

`kubectl expose deployment plunder-nginx --port=32380 --target-port=80 --type=LoadBalancer --namespace plunder`

The above example should expose a port on your external (Internet facing) address that can be tested externally with:

```sh
$ curl externalIP:32380
<!DOCTYPE html>
<html>
...
```
