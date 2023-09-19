# csv2gsheets: Create & update Google Sheets files using your local CSV

[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier) [![Accessibility-alt-text-bot](https://github.com/ttsukagoshi/csv2gsheets/actions/workflows/a11y-alt-text-bot.yml/badge.svg)](https://github.com/ttsukagoshi/csv2gsheets/actions/workflows/a11y-alt-text-bot.yml) [![Lint Code Base](https://github.com/ttsukagoshi/csv2gsheets/actions/workflows/linter.yml/badge.svg)](https://github.com/ttsukagoshi/csv2gsheets/actions/workflows/linter.yml)

A Node.js CLI tool to convert local CSV files into Google Sheets files in a designated Google Drive folder. You can choose whether to update an existing Sheets file or create a new one.

## What is it for?

csv2gsheets is a command-line tool that allows you to create and update Google Sheets files using your local CSV files. It can be useful for automating the process of updating Google Sheets files with data from your local files.

The basic workflow is as follows:

1. Create a configuration file: `c2g init`
   You will be asked to specify the path to your local CSV folder, the ID of your Google Drive folder, and some optional settings, such as whether to update existing Sheets files with the same name or create new ones. This has to be done only once.

2. Convert your CSV files into Google Sheets files: `c2g convert`
   Based on the configuration file you created in the previous step, csv2gsheets will convert your local CSV files into Google Sheets files in the designated Google Drive folder.

See...

- [Setup](#setup) for how to install csv2gsheets
- [Usage](#usage) for how to use csv2gsheets
- [Configuring csv2gsheets](#configuring-csv2gsheets) for how to configure csv2gsheets

## Setup

Go over the steps below to set up csv2gsheets for the first time.

### Install Node.js

Install the [latest LTS version of Node.js](https://nodejs.org/). A simple way to check if you have Node.js installed is to type the following command on your Terminal or PowerShell (or whatever you like to use):

```bash
node -v
```

Node.js comes with npm, a package manager for Node.js.

### Install csv2gsheets

On your Terminal, run the following command:

```bash
npm install -g csv2gsheets
```

Run `csv2gsheets` to confirm your installation:

```bash
c2g --help
```

`c2g` is the shorthand for running `csv2gsheets`. All commands in the following sections will use this shortened version but can all be replaced by its full name. For example:

```bash
c2g convert --dry-run
```

is the equivalent of running

```bash
csv2gsheets convert --dry-run
```

#### Updating csv2gsheets

New releases will be posted on [the GitHub repository](https://github.com/ttsukagoshi/csv2gsheets). To update your installed version, run the following:

```bash
npm update -g csv2gsheets
```

### Create a Google Cloud project and enable the Drive API

csv2gsheets uses the Google Drive API to create and update Google Sheets files. To use the API, you need to create a Google Cloud project and enable the Drive API. This is perhaps the most complicated part of the setup process, especially if you are unfamiliar with Google Cloud.

The basic steps are described below, but you can also refer to the [Google Cloud project](https://developers.google.com/workspace/guides/create-project) page on the Google for Developers website for more details. A less detailed but more practical guide can be found on the [official Node.js quickstart for Google Drive](https://developers.google.com/drive/api/quickstart/nodejs) page. See the sections "Prerequisites" and "Set up your environment" on the webpage.

1. Create a Google Cloud project  
   Go to the [Google Cloud Console](https://console.cloud.google.com/) and create a new project. You can also click [this link](https://console.cloud.google.com/projectcreate) to go directly to the project creation page.

   <img width="767" alt="Screenshot of the page to create a new Google Cloud project" src="https://github.com/ttsukagoshi/csv2gsheets/assets/55706659/d70594c9-8319-4145-b527-49bbf7d01e3e">

2. Enable the Drive API  
   Go to the [API Library](https://console.cloud.google.com/apis/library) page and enable the Drive API. You can also click [this link](https://console.cloud.google.com/flows/enableapi?apiid=drive.googleapis.com) to go directly to the "Enable Drive API" page.

  <img width="943" alt="Screenshot of the Enable API page" src="https://github.com/ttsukagoshi/csv2gsheets/assets/55706659/10a2b973-9dc9-4e54-9631-8b21cc86c3b7">

3. Create the OAuth consent screen  
   Go to the [OAuth consent screen](https://console.cloud.google.com/apis/credentials/consent) page and create a new consent screen. You can choose "Internal" or "External," depending on whether you want to use the tool only for yourself or share it with others. If you select "External," you must add test users. Enter your Google account and other authorized test users' addresses in the "Test users" section.

  <img width="943" alt="Screenshot of the OAuth consent screen where the user is asked to enter test accounts" src="https://github.com/ttsukagoshi/csv2gsheets/assets/55706659/186db13b-e8f2-46b3-be5b-0388468d3bba">

4. Create credentials  
   Go to the [Credentials](https://console.cloud.google.com/apis/credentials) page and create a new OAuth client ID. Choose "Desktop app" as the application type. You can choose any name you like for the client ID. Save the created credentials as a JSON file named `c2g.creds.json` and save them in your home directory.

   <img width="954" alt="Screenshot of the popup that the user will see when they have completed setting their OAuth client ID. The DOWNLOAD JSON button will be available." src="https://github.com/ttsukagoshi/csv2gsheets/assets/55706659/14cd38ec-2308-469a-816a-166333348e5a">

The credentials file saved in your home directory would be something like this:

```
# Windows
C:\Users\your-user-name\c2g.creds.json

# macOS
/Users/your-user-name/c2g.creds.json
```

Do NOT share this file with anyone unless you know exactly what you are doing. If you accidentally share it, you can always revoke the credentials by going to the [Credentials](https://console.cloud.google.com/apis/credentials) page and deleting the OAuth client ID you created.

## Usage

### Logging in to Google: `login`

Before converting your CSV file, you must log in to Google using an account with editor-level access to the target Google Drive folder. This is done by running the following command:

```bash
c2g login
```

You will see the Google login page open in your default browser. Follow the instructions on the page to log in.

If you want to check which account you are currently logged in with, use the `--status` (`-s`) option:

```bash
c2g login --status
```

Logging in will create a token file `.c2grc.json` in your home directory. DO NOT SHARE THIS FILE WITH ANYONE ELSE. This is basically a password to your Google account.

### Creating a configuration file: `init`

Running the following command will prompt you to answer several questions on how you want to use csv2gsheets in the current working directory:

```bash
c2g init
```

This will create a configuration file named `c2g.config.json` in your current working directory, specifying:

- the path to your local CSV folder
- the ID of your target Google Drive folder
- whether the target Google Drive folder is a [shared drive](https://developers.google.com/drive/api/guides/about-shareddrives)
- whether to update existing Sheets files with the same file name or create new ones
- whether to upload the original CSV files in a subfolder in the target Google Drive folder

For more information on the configuration file and its values, see the [Configuring csv2gsheets](#configuring-csv2gsheets) section.

You can create as many configuration files in different directories as you want by running `c2g init` in the respective directories. Each directory can have its own target Google Drive folder.

If you are not yet logged into Google, you can do so by using the `--login` (`-l`) option:

```bash
c2g init --login
```

This is the same as running `c2g init` and `c2g login` in sequence.

### Converting CSV files into Google Sheets files: `convert`

Convert your CSV files into Google Sheets files by running the following command:

```bash
c2g convert
```

csv2gsheets will look for the configuration file `c2g.config.json` in the current working directory and convert all CSV files in the specified directory to Google Sheets. If you want to specify the path to the configuration file, use the `--config-file-path` (`-c`) option:

```bash
c2g convert --config-file-path ./Users/your-user-name/path/to/c2g.config.json
```

Use the `--dry-run` (`-d`) option to see what files will be converted without actually converting them:

```bash
c2g convert --dry-run
```

To open the target Google Drive folder in your default browser after the conversion, use the `--browse` (`-b`) option.:

```bash
c2g convert --browse
```

Options can be combined:

```bash
c2g convert -c ./Users/path/to/c2g.config.json -d -b
```

Note that upload/conversion may take some time, depending on the number of files and their sizes. The process is subject to Google's [usage limits](https://developers.google.com/drive/api/guides/limits); you may encounter an error if you try to upload too many files simultaneously.

### Logging out of Google: `logout`

Once logged in, you will not need to log in again, regardless of your current working directory. However, if you want to log out, you can do so by running the following command:

```bash
c2g logout
```

## Configuring csv2gsheets

The configuration file `c2g.config.json` is a JSON file that specifies the following values. You can create a configuration file by running `c2g init` in the directory where you want to use csv2gsheets or manually creating and editing the file on your preferred text editor. In the latter case, save the file as `c2g.config.json` and designate UTF-8 for text encoding.

| Key                          | Type      | Description                                                                                                                      | Default Value              |
| ---------------------------- | --------- | -------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| `sourceDir`                  | `string`  | Path to the local CSV folder.                                                                                                    | The user's home directory. |
| `targetDriveFolderId`        | `string`  | ID of the target Google Drive folder. The special value `root` (case insensitive) can be used to designate the root of My Drive. | `root`                     |
| `targetIsSharedDrive`        | `boolean` | Whether the target Google Drive folder is a shared drive.                                                                        | `false`                    |
| `updateExistingGoogleSheets` | `boolean` | Whether to update existing Sheets files with the same file name or create new ones.                                              | `false`                    |
| `saveOriginalFilesToDrive`   | `boolean` | Whether to upload the original CSV files in a subfolder in the target Google Drive folder.                                       | `false`                    |
