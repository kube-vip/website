---
title: "Egress"
weight: 57
description: >
  kube-vip egress re-write.
---

## Kubernetes Networking

Kubernetes networking is highly configurable, and is largely designed to support incoming (ingress) traffic in a variety of different ways. Either through a virtual/load balancer IP that will send traffic to the internal proxies to be sent to a destination pod. Or higher level abstractions (L7) such as an ingress controller that will actually be application aware (such as HTTP), where it can inspect application behaviour (such as a requested URL `/path`) and sending that request to a different service. 

But what about traffic that leaves a kubernetes cluster?

## Kubernetes Egress traffic

Imagine the following: *"I've an application or service that I deploy that will initiate an outbound connection to an external site"*

So this application running in a pod will send traffic externally from the cluster to some other address/port else how does that work? Well all pods have internal IP addresses, these are addresses that only make sense **inside** the cluster, anything that is external simply has no way of directly interacting with these pod networks. So there is no direct connectivity from outside to an internal pod, when traffic is being sent external there needs to be a method to allow this traffic to return... this is where things get interesting!

If we packet capture traffic from our `pod` at the external location we will see that we're not recieving traffic from the `pod`, **but** we are actually recieving traffic from the `node` where the `pod` is currently running! Given this `node` has an external address it should stand that traffic can successfully go back and forth with another address on the network. When traffic returns to the `node` the rules in the kernel can then ensure the traffic is forwarded to the `pod`.


```goat
+-------+      +-----------+       +-----------+ 
|  Pod  | ---> |   worker  |  ---> |  external | (source is 192.168.0.200)
+-------+      +-----------+       +-----------+
10.0.0.1       192.168.0.200       192.168.0.250   
```

As far as the network is concerned, traffic is between the worker (192.168.0.200) and the external address (192.168.0.250), as far as a the pod is concerned is't speaking directly from (10.0.0.1) to the external address.

If the `pod` needs to be scheduled then it more than likely will appear on a different worker node at this point the external traffic will suddenly start to appear from a different address on the network. 

### Kubernetes Egress problems

What if this external source requires locking down so that only a subset of addresses can access it, given reasonable security practices the external source should have an access list of addresses. If the source keeps changing with every pod rescheduling then your firewall team are going to get angry pretty quickly. 

What if the Kubernetes node network is on it's own protected network that doesn't have direct access to other networks, in this architecture the pods are all on the internal Kubernetes pod network and all the nodes are on their own network (`172.16.0.0/24`). So at this point traffic will be sent to the external address with the source address being the internal node address, which is an address that makes no sense on that network resulting in no traffic being able to return back to the worker.

```goat
                                   +----------------+ 
               172.16.0.2     ---> |  other workers |
                   eth0            +----------------+ 
+-------+      +-----------+       
|  Pod  | ---> |   worker  |       
+-------+      +-----------+       
10.0.0.1           eth1            +-----------+
               192.168.0.240  ---> |  external | (source is 172.16.0.2)
                                   +-----------+ 
                                   192.168.0.250   
```

## kube-vip Egress

In order to provide both a stable egress addresses and the capability to utilise additional networks kube-vip provides two bits of functionality:

- `serviceInterface`, which allows binding services to a different interface than the default
- `serviceElection`, this allows kube-vip to distribute loadBalancer addresses acrosss multiple nodes

To pull all this together, kube-vip will utilise a loadBalancer address to become the **egress** source address when enabled!

```goat
                                   +----------------+ 
               172.16.0.2     ---> |  other workers |
                   eth0            +----------------+ 
+-------+      +-----------+       
|  Pod  | ---> |   worker  |       
+-------+      +-----------+       
10.0.0.1           eth1 
               192.168.0.240  
                     |      
               loadBalancer IP     +-----------+
               192.168.0.245  ---> |  external | (source is 192.168.0.245)
                                   +-----------+ 
                                   192.168.0.250                                    
```

### Using kube-vip Egress

**NOTE:** At this time, egress requires `iptables` in order to re-write rules that will change traffic. To facilitate this a seperate kube-vip image exists that has `iptables`, this image is called `kube-vip-iptables` and is available [here](https://github.com/kube-vip/kube-vip/pkgs/container/kube-vip-iptables).

**Additionally** Should your Operating System (RHEL, Rocky Linux) have started the steps to deprecate `iptables` in favour of `nftables` then you will need to use the environment variable `egress_withnftables` (set to `true`), otherwise some of the rules will be ignored by the kernel. Whilst the rules will work, you may view confusing results viewing the rules inside and outside the pod that is being egressed.

To enable Egress kube-vip requires `serviceElection` to be enabled, the Kubernetes service requires the below Egress annotation **and** it requires `externalTrafficPolicy` set to `Local`. 

```
  annotations:
    kube-vip.io/egress: "true"
spec:
  type: LoadBalancer
  externalTrafficPolicy: Local
```
*Example additions to a manifest*

The annotations mean that kube-vip will know that the traffic from the `pod` will now need modifying so that the source address becomes the address of the loadBalancer. The `externalTrafficPolicy` is required because the loadbalancer address needs to be on the same node where the pod resides, otherwise the rules written into the kernel wont work.

### Applying Egress rules only to certain destination ports

To allow differentiation of traffic, in the event you would have multiple pods performing various egress.. we can apply rules that are specific on outbound traffic. So if we had a sip client that was sending traffic out to a remote host on port `5060` we would only rewrite the egress of that traffic particularly. This is done through annotations:

```
  annotations:
    kube-vip.io/egress: "true"
    kube-vip.io/egress-destination-ports: udp:5060
```

The annotation is a colon seperated value of protocol (`udp` or `tcp`) and the destination port, you can have multiple protocols and ports by using a comma e.g. `tcp:8080,udp:5060`

### Excluding traffic for Pod and Service CIDRs

By default kube-vip wont egress traffic for the default networks:

-	Pod CIDR     = "10.0.0.0/16"
-	Service CIDR = "10.96.0.0/12"

If you've configured different ranges for your network then these values will need to be modified within the kube-vip yaml"

```
        env:
        - name: egress_podcidr
          value: "x.x.x.x/yy"
        - name: egress_servicecidr
          value: "x.x.x.x/yy"
```

This will set a different range when an egress rule is configured.
