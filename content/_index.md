+++
title = "Documentation"
[data]
baseChartOn = 3
colors = ["#627c62", "#11819b", "#ef7f1a", "#4e1154"]
columnTitles = ["Section", "Status", "Author"]
fileLink = "content/projects.csv"
title = "Projects"

+++
{{< block "grid-2" >}}
{{< column >}}

# kube-vip

kube-vip provides Kubernetes clusters with a virtual IP and load balancer for both the control plane (for building a highly-available cluster) and Kubernetes Services of type `LoadBalancer` without relying on any external hardware or software.

[![Build and publish main image regularly](https://github.com/kube-vip/kube-vip/actions/workflows/main.yaml/badge.svg)](https://github.com/kube-vip/kube-vip/actions/workflows/main.yaml)

## Features

### Control Plane

- VIP addresses can be both IPv4 or IPv6
- Control Plane with ARP (Layer 2) or BGP (Layer 3)
- Control Plane using either [leader election](https://godoc.org/k8s.io/client-go/tools/leaderelection) 
- Control Plane HA with kubeadm (static Pods)
- Control Plane HA with K3s/and others (daemonsets)
- Control Plane LoadBalancing with [ipvs](https://en.wikipedia.org/wiki/IP_Virtual_Server)

### Kubernetes Services

- Service LoadBalancer using [leader election](https://godoc.org/k8s.io/client-go/tools/leaderelection) for ARP (Layer 2)
- Distributed Layer 2 LoadBalancers through leader election per service
- Service LoadBalancer using multiple nodes with BGP
- Service LoadBalancer using [Wireguard](https://www.wireguard.com)
- Service LoadBalancer address pools per namespace or global
- Service LoadBalancer address via (existing network DHCP)
- Service LoadBalancer address exposure to gateway via UPNP
- ... manifest generation, vendor API integrations and many nore... 

{{< button "docs/" "Read the Docs" >}}
{{< /column >}}

{{< column >}}
![diy](/images/kube-vip.png)
{{< /column >}}
{{< /block >}}
