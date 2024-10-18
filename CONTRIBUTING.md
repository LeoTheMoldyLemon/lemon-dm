# Contributing to this project

This is a small guide to git practices used in this project and a short git tutorial. Please read it fully before contributing and follow the instructions.

## Setting up

To start working on this project, you will first need to clone it to your local machine.
Open a terminal in the location where you want your project to be and run `git clone [GIT_HTTPS_OR_SSH_URI]`. The HTTPS or SSH URI is under the green "Code" button on the main GitHub repository page.

## Creating a branch

So, you're set up the project and accepted a JIRA/Trello/whatever ticket for adding a new feature and want to start writting code.
Not so fast! First, you're going to want to create a new branch for that feature.
Branch names for features should be formatted "[CATEGORY]/[TICKET]-[CREATOR_NAME]".

- CATEGORY is always "feature" when creating features. "bugfix" and "release" are the other possible categories.
- TICKET is the id of the ticket you're working on, there should be one visibile on your ticket in JIRA/Trello/whatever.
- CREATOR_NAME is usually just the first letter of your name and then your surname.
  For Zaphod Beelzebub that would be "zbeelzebub".

To create a branch run `git branch [BRANCH_NAME]`.
To work within the newly created branch run `git checkout [BRANCH_NAME]`

## Commiting

When you feel like it's a good time to save your progress, you will create a new commit.
Commiting through your favorite code editor/IDE might be easiest, but you can do it the manual way if you want:
Before commiting first be sure to checkout onto the correct branch and then run `git add .` followed by `git commit`.
A text editor will now open in front of you. Write your commit message within. The message should just be a short and concise list of the things you've done since the last commit on this branch. Not why you've done it, not how it works, just what you've done. Please write this in English and using imperative (i.e. not "added new UI button", but "add new UI button").
If you don't want a text editor to open for your commit message, you can instead run `git commit -m "[COMMIT_MESSAGE]"`.

## Pull Requests

Your feature is complete! Time to merge it onto the rest of the project.
You aren't allowed to just commit onto master or even push into it, instead you have to create a PR through GitHub.
Not gonna write much more here, it's quite simple and GitHub has plenty instructions on it.
After you file a PR tag someone in Discord or move your JIRA/Trello/whatever ticket into the Code Review section and wait.
After someone reviews your code and you implement any suggested changes, you are free to merge your request.

## Getting caught up

Many people working in parallel makes things a bit complicated. What if someone merges their feature before you're finished with yours? Resolving merge conflicts within the GitHub PR system is really not recommended so instead, whenever you see someone merge their branch or you're about to create a PR and you're unsure if someone else already merged, do the following:

- Move onto the master branch - `git checkout master`
- Pull changes from the repository - `git pull origin master`
- Return to your branch - `git checkout [BRANCH_NAME]`
- Rebase the master branch onto your branch - `git rebase master`

At this point some merge conflicts may arrise that you will have to resolve locally. If this is your first time resolving these, hail someone via Discord, resolving merge conflicts is too tedious to explain here.
If you've resolved your conflicts (or there weren't any), congrats! Your branch is now all caught up to the changes your fellow contributors have introduced.
