---
title: "Services"
weight: 57
description: >
  kube-vip services reconciliation.
---

kube-vip is able to reconcile Kubernetes `Service` objects to configure networking and load balancing for those resources. Here you can find some info on specific configurations regarding the services usage.

## Enabling services processing

Service reconciliation can be enabled with the `svc_enable` env variable set to `true` or with the `--services` CLI flag.

## Loadbalancer class

kube-vip can be configured to reconcile all services or only those that have specific `spec.loadBalancerClass` provided. There are currently two modes of loadbalancer class handling. Mode can be controlled with `lbClassNameLegacyHandling` CLI flag or with `lb_class_legacy_handling` env variable. The value of `lbClassNameLegacyHandling` default to `true`.

### Legacy mode (default)

By default, in legacy mode, kube-vip will reconcile all services. To restrict kube-vip to reconcile only services with specific `loadBalancerClass` CLI flag `lbClassOnly` or env variable `lb_class_only` should be set `true`.

The name of the `loadBalancerClass` that should be reconciled can be specified with CLI flag `lbClassName` or env variable `lb_class_name`.

### Modern mode

When `lbClassNameLegacyHandling` flag/`lb_class_legacy_handling` env variable is set `false`, kube-vip will use another mode of operation regarding loadbalancer class. In this mode if `lbClassName`/`lb_class_name` is not set, kube-vip will reconcile all services, and if it was set, only services of the provided class will be reconciled.

### Ignoring service

It is possible to instruct kube-vip to not reconcile specific service, regardless of the other settings, with annotation `kube-vip.io/ignore`.

## Leader election modes

For each kube-vip's mode (`ARP`, `BGP`, `Routing Table` and `WireGuard`) various configurations of leader election can be applied. Generally, services can be processed without leader election (processing will happen on all kube-vip instances), with global leader election (only one kube-vip instance will process all services) or with per-service leader election (each service will be reconciled on a leader node elected separately for each service). Leader election can be enabled using the `svc_election` env variable/`servicesElection` CLI flag and the `vip_leaderelection` env variable/`leaderElection` CLI flag (the latter only for Routing Table mode). Below you can find all valid configurations for each mode and their meaning.

### ARP mode

| svc_election | Description                                                              |
| ------------ | ------------------------------------------------------------------------ |
| true         | Per-service leader election (leader will be elected for each service)    |
| false        | Global leader election (all services reconciled by the same leader node) |

### BGP mode

| svc_election | Description                                                              |
| ------------ | ------------------------------------------------------------------------ |
| true         | Per-service leader election (leader will be elected for each service)    |
| false        | Leader election disabled (services reconciled by all kube-vip instances) |

### Routing Table mode

| svc_election | vip_leaderelection | Description                                                              |
| ------------ | ------------------ | ------------------------------------------------------------------------ |
| true         | not used           | Per-service leader election (leader will be elected for each service)    |
| false        | true               | Global leader election (all services reconciled by the same leader node) |
| false        | false              | Leader election disabled (services reconciled by all kube-vip instances) |

### WireGuard mode

| svc_election | Description                                                           |
| ------------ | --------------------------------------------------------------------- |
| true         | Per-service leader election (leader will be elected for each service) |
| false        | Services reconciliation disabled                                      |

## Loadbalancer IP

Loadbalancer IP for the service can be specified in 3 separate ways. The precedence of those methods is as follows:

1. Annotation `kube-vip.io/loadbalancerIPs` - IP address can be specified manually. IPv4 and IPv6 can be specified for dualstack services, separated with a comma (e.g. "10.0.0.1,fe80:0001::1").
1. 'spec.loadBalancer.IP` field - can be specified manually, but can only contain one IPv4 or IPv6 address.
1. `status.loadBlancer.ingress` field - can be used if set by e.g. cloud controller.

Additionally, hostname can be used to obtain IP address using DHCP service with the annotation `kube-vip.io/loadbalancerHostname`.

### Updating service status

By default, kube-vip will update the service's `status.loadBalancer.ingress` field with the configured IP addresses obtained with e.g. `kube-vip.io/loadbalancerIPs`. This may conflict with other controllers that use/set this field (e.g. MetalLB). In such case you can disable the update of the service's `status` with CLI flag `disableServiceUpdates` or env variable `disable_service_updates` with value `true`.

## VLAN

When defining a Service, it is possible to specify an interface that should be tagged with a VLAN header by using the `kube-vip.io/serviceVLAN` annotation, kube-vip will then create a sub-interface with the configured VLAN tag and assign the VIP address to that sub-interface.

```yaml
annotations:
  kube-vip.io/serviceVLAN: "eth0.200"
```

## DHCP

IP address for service can be also requested from DHCP server with the following annotations:

- `kube-vip.io/hwaddr` - specifies hardware address (MAC) of the interface that the service should be bound to.
- `kube-vip.io/requestedIP` - the IP address that should be requested from the DHCP server.
- `kube-vip.io/loadbalancerIPs` - addresses `0.0.0.0` and/or `::` can be provided to instruct kube-vip to use DHCP to obtain IPv4 and/or IPv6 VIP address for the service from the DHCP server.
- `kube-vip.io/macvlanName` - can be used to specify the name for the MACVlan interface created by kube-vip for services that use DHCP. If not specified, the name will be randomly generated. If specified, it is possible to point multiple services to the same interface, therefore achieving shared DHCP IP address for multiple services.

### rp_filter settings

While using the DHCP, service can specify the value of `rp_filter` settings for the interface it is being bound to with annotation `kube-vip.io/rp_filter`. The value can be either `0`, `1` or `2`.

## DDNS

Services reconciled with kube-vip can use DDNS to update IP address assigned to the provided hostname (`kube-vip.io/loadbalancerHostname` annotation). This can be enabled with service annotation `kube-vip.io/ddns=true`.

## External cluster policy

kube-vip can reconcile services with both `externalClusterPolicy: Cluster` and `externalClusterPolicy: local`.

- `externalClusterPolicy: Cluster` - will reconcile service if any endpoint is available in the cluster.
- `externalClusterPolicy: Local` - will reconcile service only if an endpoint is available on the same node as the kube-vip pod is deployed on.

## Common lease feature (e.g. sharing VIP address among multiple services)

kube-vip's leader election leases can be shared to force kube-vip's components to be reconciled by selected node. When using global leader election the name of the lease can be specified with the `svc_leasename` env variable or `servicesLeaseName` CLI flag. If it will be configured to be the same as control-plane lease (set by the `vip_leasename` variable or `leaseName` flag), single leader election will be performed for both control-plane and services reconciler.

While using per-service leader election, by default kube-vip will create a separate lease for each service automatically. One can, however, override the lease name with service annotation:

```yaml
kube-vip.io/leaseName: example-lease
```

If multiple services use the same lease, all of them will be reconciled by the same leader node. This makes it possible to share the same IP address (set with`kube-vip.io/loadbalancerIPs`) among multiple services, as the VIP address will be present only on the selected leader node.

## Egress

kube-vip can configure egress (SNAT) for services. There are various annotations used for egress configuration.

- `kube-vip.io/egress` - enables egress for the service
- `kube-vip.io/egress-ipv6` - enables IPv6 egress
- `kube-vip.io/egress-internal` - use internal egress implementation (nftables)
- `kube-vip.io/egress-destination-ports` - configures destination ports (comma separated)
- `kube-vip.io/egress-source-ports` - configures source ports (comma separated)
- `kube-vip.io/egress-allowed-networks` - allowed networks for the Egress to be enabled (comma separated)
- `kube-vip.io/egress-denied-networks` - networks that egress should not be applied to (comma separated)

## Flushing conntrack

During service initialization kube-vip can flush connections tracked by `conntrack` (e.g. if service was previously configured and was changed by the operator). This can be done using `kube-vip.io/flush-conntrack` annotation.

# UPnP port forwarding

kube-vip can us UPnP (Universal Plug and Play) port forwarding for services. To use this feature two things has to be configured.

1. Support for UPnP has to be enabled in the kube-vip configuration using env variable.
   ```yaml
   env:
   - name: "enable_upnp"
     value: "true"
   ```
1. UPnP has to be enabled for the specific service with annotation `kube-vip.io/forwardUPNP=true`.
