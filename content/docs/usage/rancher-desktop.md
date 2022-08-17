---
title: "rancher desktop"
weight: 57
description: >
  kube-vip usage on Rancher Desktop.
---

## Disable the existing Load Blancer

At the current moment the UI only exposes a subset of the functionality that can be enabled/disabled for `k3s` that runs within the Rancher Desktop application. You will need to create an `override.yaml` in the `~/Library/Application Support/rancher-desktop/lima/_config/` folder, that contains the following:

```
# https://github.com/rancher-sandbox/rancher-desktop/issues/578#issuecomment-996557436
env:
  K3S_EXEC: --disable=servicelb
```

This will then ensure that `k3s` will start with the internal service lb disabled. To apply this change you will need to then `[Reset Kubernetes]`, **not** the factory reset as this will remove the override file.

## Applying kube-vip

With Rancher Desktop you're typically left with `nerdctl` to apply manifests, so the following steps are required:

### Apply Network range

**Note** I've yet to determine what would be the correct IP range **or if DHCP would work (this is still WiP)

```
kubectl create configmap --namespace kube-system kubevip --from-literal range-global=172.18.100.10-172.18.100.30
configmap/kubevip created
```

### Apply the RBAC and cloud controller

RBAC:
```
kubectl apply -f https://kube-vip.io/manifests/rbac.yaml
```

Cloud Controller:
```
 kubectl apply -f https://raw.githubusercontent.com/kube-vip/kube-vip-cloud-provider/main/manifest/kube-vip-cloud-controller.yaml
```

### Install kube-vip

We can parse the GitHub API to find the latest version (or we can set this manually)

`KVVERSION=$(curl -sL https://api.github.com/repos/kube-vip/kube-vip/releases | jq -r ".[0].name")`

or manually:

`export KVVERSION=vx.x.x`

We will now use `nerdctl` to install `kube-vip` on the cluster:

`alias kube-vip="nerdctl run --network host --rm ghcr.io/kube-vip/kube-vip:$KVVERSION"`

Finally install `kube-vip` into the cluster with the following line:

`kube-vip manifest daemonset --services --inCluster --arp --interface eth0 | kubectl apply -f -`

**Note** 

Given the `lima` network, this will get kube-vip deployed.. in order to expose services to the outside world you may need to log into the VM and modify some rules. 