# Zalando

**How to get started?**

Read [Open Source Guild (Techwiki)](https://techwiki.zalando.net/display/GUL/Open+Source+Guild).

**How to deploy?**

1. Build a new Docker image with `./tools/build.sh`
2. Log in to PierOne with `pierone login --url registry-write.opensource.zalan.do`
3. Push the image, e.g. `docker push registry-write.opensource.zalan.do/opensource/zappr:88d2a0e`
4. Log in to AWS with `mai login opensource`
5. Create a new Senza stack, e.g. `senza create senza/zappr-live.yml 88d2a0e 88d2a0e`

**How to configure?**

1. Create a new application for *zappr* in your [Github account](https://github.com/settings/applications).
2. Encrypt the client secret with `./tools/kms.sh`
3. Put the client id and encrypted secret into senza.yml
