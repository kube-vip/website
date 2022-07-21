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

## Modes 

### ARP

**ARP** is a layer 2 protocol that is used to inform the network of the location of a new address. When a new IP address is configured to a device, there needs to be a mechanism to inform the network of which piece of hardware is hosting this new address. ARP is the technology that is used to ensure that a network understands the link between the hardware address (MAC) and the logical address (IP). In order to inform the entire layer 2 network of a net IP <--> MAC pairing typically a gratuitous ARP broadcast is performed, more detail can be found here [https://www.practicalnetworking.net/series/arp/gratuitous-arp/](https://www.practicalnetworking.net/series/arp/gratuitous-arp/)

### BGP

**BGP** is a mechanism so that networks that rely on routing (layer 3) can ensure that new addresses are advertised to the routing infrastructure. When this information has been updated it transparently means that the router will automatically forward traffic to the correct devices.

### Routing Table

The **Routing Table** mode is to allow additional routing technologies such as ECMP etc. to be configured so that traffic can be send to a range of nodes (such as your Kubernetes nodes), and kube-vip will manage the addition/deletion of addresses to the routing tables of these nodes so that they can recieve the correct traffic.

### WireGuard

The [**Wireguard**](https://www.wireguard.com/) mode allows Kubernetes services to be advertised over the wireguard interface (`wg0`). One of its main use-case is so that distributed services across multiple clusters can centralise all their advised services on a central network controlled by wireguard.

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
