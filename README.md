[![GitHub License](https://img.shields.io/github/license/Unarekin/FoundryVTT-Token-Nameplates)](https://raw.githubusercontent.com/Unarekin/FoundryVTT-Token-Nameplates/refs/heads/master/LICENSE?token=GHSAT0AAAAAACYQQTQK6ODLNX6QMRS6G7GWZY22EZQ)
![GitHub package.json version](https://img.shields.io/github/package-json/v/Unarekin/FoundryVTT-Token-Nameplates)
![Supported Foundry Version](https://img.shields.io/endpoint?url=https%3A%2F%2Ffoundryshields.com%2Fversion%3Fstyle%3Dflat%26url%3Dhttps%3A%2F%2Fraw.githubusercontent.com%2FUnarekin%2FFoundryVTT-Token-Nameplates%2Frefs%2Fheads%2Fmain%2Fmodule.json)
![Supported Game Systems](https://img.shields.io/endpoint?url=https%3A%2F%2Ffoundryshields.com%2Fsystem%3FnameType%3Dfull%26showVersion%3D1%26style%3Dflat%26url%3Dhttps%3A%2F%2Fraw.githubusercontent.com%2FUnarekin%2FFoundryVTT-Token-Nameplates%2Frefs%2Fheads%2Fmain%2Fmodule.json)

![GitHub Downloads (specific asset, latest release)](https://img.shields.io/github/downloads/Unarekin/FoundryVTT-Token-Nameplates/latest/module.zip)
[![Forge Installs](https://img.shields.io/badge/dynamic/json?label=Forge%20Installs&query=package.installs&suffix=%25&url=https%3A%2F%2Fforge-vtt.com%2Fapi%2Fbazaar%2Fpackage%2Ftoken-nameplates)](https://forge-vtt.com/bazaar#package=token-nameplates) 


[![Discord](https://img.shields.io/badge/Discord-%235865F2.svg?&logo=discord&logoColor=white)](https://discord.gg/MdvvxtnCRJ)

- [Token Nameplates](#token-nameplates)
- [Installation](#installation)
- [Usage](#usage)
  - [Global Configurations](#global-configurations)
  - [Value Interpolation](#value-interpolation)
- [Support](#support)


# Token Nameplates

Token Nameplates adds the ability to add multiple customizable blocks of text above or below a token.  The text can be static or taken from a value on the token itself, such as their HP.


# Installation

To install this module, copy and paste the following manifest URL into the module installation dialog in Foundry VTT
```
https://github.com/Unarekin/FoundryVTT-Token-Nameplates/releases/latest/download/module.json
```

# Usage

Token Nameplates allows for adding "nameplates" -- discrete blocks of text arranged above or below the token.  A token has two default nameplates:  Its name and a "tooltip".  The tooltip nameplate is what Foundry uses by default to show a token's elevation.  These nameplates can be hidden, removed, or edited just like any other.

<img width="1565" height="838" alt="image" src="https://github.com/user-attachments/assets/89e7ac36-e275-4b25-9527-df3f8e868a38" />

Nameplates are split into two groups:  Upper, and lower.  As one might expect, upper nameplates are listed above the token, starting from the token and going upwards and lower nameplates are displayed below the token, starting from the token and going down.

Most of the settings for a nameplate should be fairly self-explanatory:  The `value` is the text displayed, `angle` is the angle at which it is displayed (in degrees), etc.

The `padding` setting for a nameplate is an arbitrary value in pixels that the nameplate will be moved horizontally or vertically, for fine-tuning the nameplate's position.  This could be especially useful for integrating with modules such as [Bar Brawl](https://foundryvtt.com/packages/barbrawl) that add elements around the token.

The outline and glow effects can be configured with their relevant options, but also they can be set to use a color based on the token's disposition (neutral, friendly, hostile, etc) 

<img width="600" alt="image" src="https://github.com/user-attachments/assets/2d8c2f17-e544-4933-b694-b870bff90a5e" />



## Global Configurations

Token Nameplates supports a default global configuration, as well as default configurations based on actor type.  These settings are the same as for an individual token.

<img width="318" height="392" alt="image" src="https://github.com/user-attachments/assets/337b1f01-de99-426c-a7ab-241d955b98f6" />

## String Interpolation

Token Nameplates can substitute values from a token by specially formatting its text.

For more information, see [the wiki](https://github.com/Unarekin/FoundryVTT-Token-Nameplates/wiki/Interpolation)

# Acknowledgements

Special thanks to Element_Re for his configuration for [Token Variant Art](https://foundryvtt.com/packages/token-variants) to add titles/epithets to tokens.  Part of TVA's update to Foundry v13 broke this configuration, which led to me making this module in the first place.


# Support
<a href='https://ko-fi.com/C0C2156VW2' target='_blank'><img height='36' style='border:0px;height:36px;' src='https://storage.ko-fi.com/cdn/kofi5.png?v=6' border='0' alt='Buy Me a Coffee at ko-fi.com' /></a>

