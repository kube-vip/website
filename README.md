# Guide

This guide covers the necessary bits. As the project evolves, it will only become more comprehensive

## Updating

This site uses the Compose Hugo theme loaded as a Hugo module. Updating the theme from the base site directory: `hugo mod get -u ./...`

To run a live server as you're working on doc updates, please use the following command:

```
hugo server --bind 0.0.0.0 -b `hostname -f`
```