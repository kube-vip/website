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

# Kube-Vip

Kube-Vip provides Kubernetes clusters with a virtual IP and load balancer for both the control plane (for building a highly-available cluster) and Kubernetes Services of type `LoadBalancer` without relying on any external hardware or software.

{{< button "docs/kube-vip/" "Read the Docs" >}}
{{< /column >}}

{{< column >}}
![diy](/images/kube-vip.png)
{{< /column >}}
{{< /block >}}