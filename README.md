# Octopur tracker Predictor Lovelace Card

Custom card for https://github.com/plutomedia987/homeassistant_tracker_predictor

Clicking on the depature board shows the train location

## Installation HACS (Easiest)

Add this as a custom reposity in to HACS

[![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=plutomedia987&repository=https%3A%2F%2Fgithub.com%2Fplutomedia987%2Flovelace-tracker_predictor&category=Dashboard)

## GUI Setup

This card supports the GUI card editor

The low price highlights anything <= this price in green

The mid price highlights anything <= this price in orange

Anything higher than the mid price is highlighted in red

## YAML Configuration

```yaml
type: custom:tracker-prediction-card
entity: sensor.octo_tracker_14_predic_december_2023_east_england
electric_low_price: 15,
electric_mid_price: 23,
gas_low_price: 5,
gas_mid_price: 5.5,
gas_bodge: 1.2,   # Set offset value. Not sure why I need these at the mo.
electric_bodge: 3.9
```
