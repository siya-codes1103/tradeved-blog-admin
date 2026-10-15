---
title: 'Options Greeks Simplified: Delta to Theta'
category: futures-and-options
level: Beginner
description: >-
  Options Greeks Simplified: Delta to Theta. A clear, example-led explanation of
  Delta, Gamma, Theta and Vega for Indian option traders.
author: sachin-rao
reviewer: rohan-malhotra
primary_keyword: options greeks simplified delta to theta
secondary_keywords:
  - options greeks
  - delta
  - theta
  - gamma
faqs: []
status: published
published_at: '2026-10-13T05:09:01.676Z'
created_at: '2026-10-13T05:09:01.676Z'
updated_at: '2026-10-13T05:09:01.676Z'
---

## Summary
:::note
Options trading sirf spot price ke direction par depend nahi karti. Options Greeks batate hain ki market price move hone, time beetne aur volatility change hone par aapke Call ya Put option premium par kitna asar padega.
:::

## Options Greeks Comparison
:::compare
Greek | Kya Measure Karta Hai? | Normal Range | Real Impact on Option
Delta | Spot price move par premium change | 0 to 1.0 (Call) / -1.0 to 0 (Put) | Nifty 100 pt badhne par premium kitna chalega
Gamma | Delta badhne ya ghatne ki speed | Always Positive | Delta ka accelerator, expiry par high risk
Theta | Har din beetne par time decay | Negative (Premium loss) | Expiry ke paas premium ka natural melt hona
Vega | Implied Volatility (IV) mein change | Always Positive | IV spike hone par Call aur Put dono mehnga hona
:::

## Key Greeks Facts
:::facts
ATM Delta: approx 0.50
ITM Delta: 0.70 to 1.00
OTM Delta: 0.10 to 0.30
Theta Decay: Fastest in last 3 days
:::

## 1. Delta: The Directional Speedometer
Delta batata hai ki agar Nifty 1 point move karega, toh aapke option premium mein kitne points ka change aayega:
- **At-the-Money (ATM):** Delta lagbhag 0.50 hota hai. Agar Nifty 100 point upar jata hai, toh ATM Call premium lagbhag 50 point badhega.
- **In-the-Money (ITM):** Delta 0.70 se 1.0 ke beech hota hai. Yeh futures ki tarah fast move karta hai.
- **Out-of-the-Money (OTM):** Delta 0.10 se 0.30 ke beech hota hai. Nifty ke 100 point move par yeh sirf 10–20 point chalega.

## 2. Gamma: The Accelerator
Gamma batata hai ki spot price badalne par Delta kitni tezi se badhega ya ghatega. Expiry day par ATM strikes par Gamma sabse zyada dangerous aur fast hota hai, jisse violent price swings aate hain.

## 3. Theta: The Silent Enemy of Option Buyers
Theta har option buyer ka loss aur option seller ka profit hota hai. Options ek expiring contract hain, isliye har ghanta beetne ke sath unka premium melt hota rehta hai. Yeh decay aakhiri 2-3 dino mein sabse tezi se girta hai.

## Pros and Cons for Retail Traders
:::proscons
+ Delta 0.50+ (ATM/ITM) trades offer consistent risk-reward for buyers
+ Option sellers can earn consistent decay income via high Theta
- Deep OTM options have low Delta and lose 100% value to Theta decay
- Holding long options over weekends exposes capital to 2 days of time melt
:::

## Steps to Check Greeks Before Placing a Trade
:::steps
Open the Option Chain on your broker or TradeVed terminal.
Identify the spot price and locate the At-The-Money (ATM) strike.
Check the Delta: ensure it is at least 0.45 before buying a Call or Put.
Check the Theta value to calculate expected premium loss per day.
Set a strict stop-loss and exit quickly if momentum turns sideways.
:::
