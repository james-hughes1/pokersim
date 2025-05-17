#!/bin/bash

# Mapping suits
declare -A suits=( ["clubs"]="C" ["diamonds"]="D" ["hearts"]="H" ["spades"]="S" )

# Loop through all PNGs like 2_of_clubs.png
for file in *_of_*.png; do
  # Extract rank and suit
  rank=$(echo "$file" | cut -d'_' -f1)
  suit=$(echo "$file" | cut -d'_' -f3 | cut -d'.' -f1)

  # Normalize rank (10 → T)
  if [ "$rank" = "10" ]; then
    rank="T"
  elif [ "$rank" = "jack" ]; then
    rank="J"
  elif [ "$rank" = "queen" ]; then
    rank="Q"
  elif [ "$rank" = "king" ]; then
    rank="K"
  elif [ "$rank" = "ace" ]; then
    rank="A"
  fi

  # Get suit abbreviation
  suit_letter=${suits[$suit]}

  # New filename
  new_name="${rank}${suit_letter}.png"

  # Rename
  mv "$file" "$new_name"
done
