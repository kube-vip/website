---
title: "Upgrade using manifest"
weight: 24
description: >
  Upgrade static Pod or DaemonSet installs by refreshing the kube-vip manifest.
---

There are two supported approaches. Prefer **regenerating** the manifest when
moving across versions that added or renamed flags; a simple image-tag bump is
enough for patch releases when your flags are unchanged.

## Static Pod (kubeadm)

Default path on each control-plane node: `/etc/kubernetes/manifests/kube-vip.yaml`.
The kubelet restarts the static Pod when that file changes. No node reboot is
required.

### Option A - bump the image tag only

Edit the manifest on **one** control-plane node and set the container image to
the new tag (for example `ghcr.io/kube-vip/kube-vip:v0.8.0`). Save the file and
wait until the kube-vip Pod is running again and the VIP still answers:

```sh
sudo sed -i 's#ghcr.io/kube-vip/kube-vip:.*#ghcr.io/kube-vip/kube-vip:v0.8.0#' \
  /etc/kubernetes/manifests/kube-vip.yaml

# confirm the static Pod restarted (name may include a random suffix)
kubectl -n kube-system get pods -l app=kube-vip 2>/dev/null || \
  kubectl -n kube-system get pods | grep kube-vip
```

Repeat on each remaining control-plane node.

### Option B - regenerate the manifest (recommended across minor versions)

Match the flags you use in production (see
[static Pod installation](/docs/installation/static/)). Example ARP control-plane
+ services setup:

```sh
export VIP=<your-vip>
export INTERFACE=<your-interface>
export KVVERSION=v0.8.0   # or: $(curl -sL https://api.github.com/repos/kube-vip/kube-vip/releases/latest | jq -r .tag_name)

alias kube-vip="docker run --network host --rm ghcr.io/kube-vip/kube-vip:$KVVERSION"
# containerd alternative:
# alias kube-vip="ctr image pull ghcr.io/kube-vip/kube-vip:$KVVERSION; ctr run --rm --net-host ghcr.io/kube-vip/kube-vip:$KVVERSION vip /kube-vip"

kube-vip manifest pod \
  --interface "$INTERFACE" \
  --address "$VIP" \
  --controlplane \
  --services \
  --arp \
  --leaderElection | sudo tee /etc/kubernetes/manifests/kube-vip.yaml
```

Apply the same regenerated file on every control-plane node (copy with `scp` or
re-run the generator on each node). Leader election absorbs the rolling restart.

## DaemonSet installs

If kube-vip runs as a DaemonSet instead of a static Pod:

1. Regenerate with `kube-vip manifest daemonset ...` using the same flags as
   [DaemonSet installation](/docs/installation/daemonset/), **or** update the
   image field in the live DaemonSet.
2. Apply the manifest (`kubectl apply -f ...`). Kubernetes rolls the Pods;
   watch with `kubectl -n kube-system rollout status ds/kube-vip` (name may
   differ if you customized it).

Keep the RBAC manifest current as well when release notes call for it:

```sh
kubectl apply -f https://kube-vip.io/manifests/rbac.yaml
```

## After upgrade

- Confirm the VIP still reaches the API server: `kubectl cluster-info` or
  `curl -k https://<VIP>:6443/livez`.
- Check kube-vip logs on a control-plane node for leader election and ARP/BGP
  errors.
- If the Pod crash-loops, compare your regenerated flags with the previous
  manifest; do not mix unrelated configuration changes into the same upgrade
  step.