# Hack Week 4

**How to get started?**

Read [AWS Hackweek Account (Techwiki)](https://techwiki.zalando.net/display/DT/AWS+Hackweek+Account).

**How to deploy?**

1. Build a new Docker image with `./tools/build.sh`
2. Log in to PierOne with `pierone login`
3. Push the image, e.g. `docker push pierone.stups.zalan.do/hackweek/zappr:88d2a0e`
4. Log in to AWS with `mai login hackweek-PowerUser`
5. Create a new Senza stack, e.g. `senza create senza.yml 88d2a0e 88d2a0e`
