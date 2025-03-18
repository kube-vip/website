---
title: "Upgrade using manifest"
weight: 24
description: >
  kube-vip version upgrade using yaml
---

As with most cases of kuberentes resources, substituting the value of image to desired version triggers the upgrade process of that resource. To upgrade kube-vip please edit the yaml file located at `/etc/kubernetes/manifests/kube-vip.yaml` and set the image version you want to upgrade to. This should simply restart the pods which in turn will restart the leader election and kube-vip will take over the VIP.