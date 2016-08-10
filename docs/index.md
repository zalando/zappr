# Zappr

*Enhance your Github workflow*

Zappr is a Github integration built to enhance your project workflow. Created by open-source enthusiasts, it's aimed at helping developers to increase productivity and improve open-source project quality. It does this primarily by removing bottlenecks around pull request approval and helping project owners to halt "rogue" pull requests before they're merged into the master branch.

## Features

- you can enable/disable pull request approval checks per repository, with the simple flip of a toggle
- you can configure what counts an approval and what doesn't
- via a configuration file that you insert in your repository, you can override Github's default settings and endow users with PR approval authorization by inviting them by name, organization and/or contributor status.
- automagically append links to issues / tickets to the body of a pull request

## Why We Developed Zappr

### Code Review

Zappr is our attempt to restore and improve code review to the process of developing a project on Github. Github doesn't impose restrictions on project contributions. While great for openness, this can pose challenges for project developers who want contributors to follow certain guidelines. This challenge is noted in the "[Dear Github](https://github.com/dear-github/dear-github)" letter that went viral in 2015.

### Compliance

We are proponents of being able to do as much work as possible in Github, using Github. When working with compliance requirements, however, this can get tricky: how can developers employ the four-eyes principle on Github? Zappr aims to address this by applying a review/approval function to the project workflow at a critical point of transition.

### No More Bottlenecks

We think it could be very useful for larger open-source projects that can't rely on a handful of admins to handle all PRs without sacrificing quality control.

## Technical Requirements

This is easy: All you need is a Github account. No setup is required. To start using Zappr on a specific project, you *do* have to opt-in as a project/repo owner. Then you're set.
