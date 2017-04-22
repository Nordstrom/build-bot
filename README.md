# build-bot
Bot that can Build, Deploy, and Whistle

ha


# Tests

`npm test`

# Run in local shell (no Slack)
```
npm run shell
...
##>@shellbot hi
Hello.
##>help
usage:
/dm - switch to DM context
/ch - switch to channel context
exit, \q - close shell and exit
help, \? - print this usage
clear, \c - clear the terminal screen
##>
```

# Run in Slack

`BOT_TOKEN=bot-slack-token npm run slack`


# Deploy / Commmit Flow
1. @johnny5 deploy xyz minor
2. bot asks for confirmation
3. bot attempts Mgr.requestDeploy; if fails reports failure (build is already running, etc).  possibly repurpose canceled builds.
4. bot updates package.json with latest version.  if another build with same semantic level was canceled, it uses this as the version.
5. bot pushes package.json change to git.
6. git push triggers drone build.
7. drone task: attempt Mgr.startDeploy with package.json version.  if version was already deployed return already deployed, if no version exists return no version exists, if version is in the wrong state return wrong state.
8. drone task: if prod deploy was successfully started or event: tag occurred this should only run the prod deploy build.
9. drone task: make sure git branch up-to-date with master
10. drone task: run tests
12. drone task: slack tests passed
13. drone task: deploy
14. drone task: run smoke tests
15. drone task: slack deployed and smoke tested
17. drone task: call Mgr.finishDeploy to mark finished
18. > @johnny5 says deploy done asks for commit or not
19. @johnny5 commit
20. bot asks for confirmation
21. bot merges branch into master
22. bot tags master with version and release notes from story descriptions.
23. bot updates jira fixed version on stories
24. bot attempts Mgr.commitDeploy

BLAHH

# Deploy / Rollback Flow
1. @johnny5 deploy xyz minor
2. bot asks for confirmation
3. bot attempts Mgr.requestDeploy; if fails reports failure (build is already running, etc).  possibly repurpose canceled builds.
4. bot updates package.json with latest version.  if another build with same semantic level was canceled, it uses this as the version.
5. bot pushes package.json change to git.
6. git push triggers drone build.
7. drone task: attempt Mgr.startDeploy with package.json version.  if version was already deployed return already deployed, if no version exists return no version exists, if version is in the wrong state return wrong state.
8. drone task: if prod deploy was successfully started or event: tag occurred this should only run the prod deploy build.
9. drone task: make sure git branch up-to-date with master
10. drone task: run tests
12. drone task: slack tests passed
13. drone task: deploy
14. drone task: run smoke tests
15. drone task: slack deployed and smoke tested
17. drone task: call Mgr.finishDeploy to mark finished
18. > @johnny5 says deploy done asks for commit or not
19. @johnny5 rollback
20. bot asks for confirmation
21. bot deploys (through drone?) from master
