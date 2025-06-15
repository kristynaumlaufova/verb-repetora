"""
fsrs.fsrs
---------

This module defines each of the classes used in the fsrs package.

Classes:
    State: Enum representing the learning state of a Card object.
    Rating: Enum representing the four possible ratings when reviewing a card.
    Card: Represents a flashcard in the FSRS system.
    ReviewLog: Represents the log entry of a Card that has been reviewed.
    Scheduler: The FSRS spaced-repetition scheduler.
"""

from __future__ import annotations
import math
from datetime import datetime, timezone, timedelta
from copy import copy
from enum import IntEnum
from random import random
import time

STABILITY_MIN = 0.001

DEFAULT_PARAMETERS = (
    0.2172,
    1.1771,
    3.2602,
    16.1507,
    7.0114,
    0.57,
    2.0966,
    0.0069,
    1.5261,
    0.112,
    1.0178,
    1.849,
    0.1133,
    0.3127,
    2.2934,
    0.2191,
    3.0004,
    0.7536,
    0.3332,
    0.1437,
    0.2,
)

FUZZ_RANGES = [
    {
        "start": 2.5,
        "end": 7.0,
        "factor": 0.15,
    },
    {
        "start": 7.0,
        "end": 20.0,
        "factor": 0.1,
    },
    {
        "start": 20.0,
        "end": math.inf,
        "factor": 0.05,
    },
]


class State(IntEnum):
    """
    Enum representing the learning state of a Card object.
    """

    Learning = 1
    Review = 2
    Relearning = 3


class Rating(IntEnum):
    """
    Enum representing the four possible ratings when reviewing a card.
    """

    Again = 1
    Hard = 2
    Good = 3
    Easy = 4


class Card:
    """
    Represents a flashcard in the FSRS system.

    Attributes:
        card_id: The id of the card. Defaults to the epoch milliseconds of when the card was created.
        state: The card's current learning state.
        step: The card's current learning or relearning step or None if the card is in the Review state.
        stability: Core mathematical parameter used for future scheduling.
        difficulty: Core mathematical parameter used for future scheduling.
        due: The date and time when the card is due next.
        last_review: The date and time of the card's last review.
    """

    card_id: int
    state: State
    step: int | None
    stability: float | None
    difficulty: float | None
    due: datetime
    last_review: datetime | None

    def __init__(
        self,
        card_id: int | None = None,
        state: State = State.Learning,
        step: int | None = None,
        stability: float | None = None,
        difficulty: float | None = None,
        due: datetime | None = None,
        last_review: datetime | None = None,
    ) -> None:
        if card_id is None:
            # epoch milliseconds of when the card was created
            card_id = int(datetime.now(timezone.utc).timestamp() * 1000)
            # wait 1ms to prevent potential card_id collision on next Card creation
            time.sleep(0.001)
        self.card_id = card_id

        self.state = state

        if self.state == State.Learning and step is None:
            step = 0
        self.step = step

        self.stability = stability
        self.difficulty = difficulty

        if due is None:
            due = datetime.now(timezone.utc)
        self.due = due

        self.last_review = last_review

    def __repr__(self) -> str:
        return (
            f"{self.__class__.__name__}("
            f"card_id={self.card_id}, "
            f"state={self.state}, "
            f"step={self.step}, "
            f"stability={self.stability}, "
            f"difficulty={self.difficulty}, "
            f"due={self.due}, "
            f"last_review={self.last_review})"
        )

    def to_dict(self) -> dict[str, int | float | str | None]:
        """
        Returns a JSON-serializable dictionary representation of the Card object.

        This method is specifically useful for storing Card objects in a database.

        Returns:
            A dictionary representation of the Card object.
        """

        return_dict = {
            "card_id": self.card_id,
            "state": self.state.value,
            "step": self.step,
            "stability": self.stability,
            "difficulty": self.difficulty,
            "due": self.due.isoformat(),
            "last_review": self.last_review.isoformat() if self.last_review else None,
        }

        return return_dict

    @staticmethod
    def from_dict(source_dict: dict[str, int | float | str | None]) -> Card:
        """
        Creates a Card object from an existing dictionary.

        Args:
            source_dict: A dictionary representing an existing Card object.

        Returns:
            A Card object created from the provided dictionary.
        """

        card_id = int(source_dict["card_id"])
        state = State(int(source_dict["state"]))
        step = source_dict["step"]
        stability = (
            float(source_dict["stability"]) if source_dict["stability"] else None
        )
        difficulty = (
            float(source_dict["difficulty"]) if source_dict["difficulty"] else None
        )
        due = datetime.fromisoformat(source_dict["due"])
        last_review = (
            datetime.fromisoformat(source_dict["last_review"])
            if source_dict["last_review"]
            else None
        )

        return Card(
            card_id=card_id,
            state=state,
            step=step,
            stability=stability,
            difficulty=difficulty,
            due=due,
            last_review=last_review,
        )


class ReviewLog:
    """
    Represents the log entry of a Card object that has been reviewed.

    Attributes:
        card_id: The id of the card being reviewed.
        rating: The rating given to the card during the review.
        review_datetime: The date and time of the review.
        review_duration: The number of miliseconds it took to review the card or None if unspecified.
    """

    card_id: int
    rating: Rating
    review_datetime: datetime
    review_duration: int | None

    def __init__(
        self,
        card_id: int,
        rating: Rating,
        review_datetime: datetime,
        review_duration: int | None = None,
    ) -> None:
        self.card_id = card_id
        self.rating = rating
        self.review_datetime = review_datetime
        self.review_duration = review_duration

    def __repr__(self) -> str:
        return (
            f"{self.__class__.__name__}("
            f"card_id={self.card_id}, "
            f"rating={self.rating}, "
            f"review_datetime={self.review_datetime}, "
            f"review_duration={self.review_duration})"
        )

    def to_dict(
        self,
    ) -> dict[str, dict | int | str | None]:
        """
        Returns a JSON-serializable dictionary representation of the ReviewLog object.

        This method is specifically useful for storing ReviewLog objects in a database.

        Returns:
            A dictionary representation of the ReviewLog object.
        """

        return_dict = {
            "card_id": self.card_id,
            "rating": self.rating.value,
            "review_datetime": self.review_datetime.isoformat(),
            "review_duration": self.review_duration,
        }

        return return_dict

    @staticmethod
    def from_dict(
        source_dict: dict[str, dict | int | str | None],
    ) -> ReviewLog:
        """
        Creates a ReviewLog object from an existing dictionary.

        Args:
            source_dict: A dictionary representing an existing ReviewLog object.

        Returns:
            A ReviewLog object created from the provided dictionary.
        """

        card_id = source_dict["card_id"]
        rating = Rating(int(source_dict["rating"]))
        review_datetime = datetime.fromisoformat(source_dict["review_datetime"])
        review_duration = source_dict["review_duration"]

        return ReviewLog(
            card_id=card_id,
            rating=rating,
            review_datetime=review_datetime,
            review_duration=review_duration,
        )


class Scheduler:
    """
    The FSRS scheduler.

    Enables the reviewing and future scheduling of cards according to the FSRS algorithm.

    Attributes:
        parameters: The model weights of the FSRS scheduler.
        desired_retention: The desired retention rate of cards scheduled with the scheduler.
        learning_steps: Small time intervals that schedule cards in the Learning state.
        relearning_steps: Small time intervals that schedule cards in the Relearning state.
        maximum_interval: The maximum number of days a Review-state card can be scheduled into the future.
        enable_fuzzing: Whether to apply a small amount of random 'fuzz' to calculated intervals.
    """

    parameters: tuple[float, ...]
    desired_retention: float
    learning_steps: tuple[timedelta, ...]
    relearning_steps: tuple[timedelta, ...]
    maximum_interval: int
    enable_fuzzing: bool

    def __init__(
        self,
        parameters: tuple[float, ...] | list[float] = DEFAULT_PARAMETERS,
        desired_retention: float = 0.9,
        learning_steps: tuple[timedelta, ...] | list[timedelta] = (
            timedelta(minutes=1),
            timedelta(minutes=10),
        ),
        relearning_steps: tuple[timedelta, ...] | list[timedelta] = (
            timedelta(minutes=10),
        ),
        maximum_interval: int = 36500,
        enable_fuzzing: bool = True,
    ) -> None:
        self.parameters = tuple(parameters)
        self.desired_retention = desired_retention
        self.learning_steps = tuple(learning_steps)
        self.relearning_steps = tuple(relearning_steps)
        self.maximum_interval = maximum_interval
        self.enable_fuzzing = enable_fuzzing

        self._DECAY = -self.parameters[20]
        self._FACTOR = 0.9 ** (1 / self._DECAY) - 1

    def __repr__(self) -> str:
        return (
            f"{self.__class__.__name__}("
            f"parameters={self.parameters}, "
            f"desired_retention={self.desired_retention}, "
            f"learning_steps={self.learning_steps}, "
            f"relearning_steps={self.relearning_steps}, "
            f"maximum_interval={self.maximum_interval}, "
            f"enable_fuzzing={self.enable_fuzzing})"
        )

    def get_card_retrievability(
        self, card: Card, current_datetime: datetime | None = None
    ) -> float:
        """
        Calculates a Card object's current retrievability for a given date and time.

        The retrievability of a card is the predicted probability that the card is correctly recalled at the provided datetime.

        Args:
            card: The card whose retrievability is to be calculated
            current_datetime: The current date and time

        Returns:
            The retrievability of the Card object.
        """

        if card.last_review is None:
            return 0

        if current_datetime is None:
            current_datetime = datetime.now(timezone.utc)

        elapsed_days = max(0, (current_datetime - card.last_review).days)

        return (1 + self._FACTOR * elapsed_days / card.stability) ** self._DECAY

    def review_card(
        self,
        card: Card,
        rating: Rating,
        review_datetime: datetime | None = None,
        review_duration: int | None = None,
    ) -> tuple[Card, ReviewLog]:
        """
        Reviews a card with a given rating at a given time for a specified duration.

        Args:
            card: The card being reviewed.
            rating: The chosen rating for the card being reviewed.
            review_datetime: The date and time of the review.
            review_duration: The number of miliseconds it took to review the card or None if unspecified.

        Returns:
            A tuple containing the updated, reviewed card and its corresponding review log.

        Raises:
            ValueError: If the `review_datetime` argument is not timezone-aware and set to UTC.
        """

        if review_datetime is not None and (
            (review_datetime.tzinfo is None) or (review_datetime.tzinfo != timezone.utc)
        ):
            raise ValueError("datetime must be timezone-aware and set to UTC")

        card = copy(card)

        if review_datetime is None:
            review_datetime = datetime.now(timezone.utc)

        days_since_last_review = (
            (review_datetime - card.last_review).days if card.last_review else None
        )

        match card.state:
            case State.Learning:
                # update the card's stability and difficulty
                if card.stability is None and card.difficulty is None:
                    card.stability = self._initial_stability(rating)
                    card.difficulty = self._initial_difficulty(rating)

                elif days_since_last_review is not None and days_since_last_review < 1:
                    card.stability = self._short_term_stability(
                        stability=card.stability, rating=rating
                    )
                    card.difficulty = self._next_difficulty(
                        difficulty=card.difficulty, rating=rating
                    )

                else:
                    card.stability = self._next_stability(
                        difficulty=card.difficulty,
                        stability=card.stability,
                        retrievability=self.get_card_retrievability(
                            card,
                            current_datetime=review_datetime,
                        ),
                        rating=rating,
                    )
                    card.difficulty = self._next_difficulty(
                        difficulty=card.difficulty, rating=rating
                    )

                # calculate the card's next interval
                ## first if-clause handles edge case where the Card in the Learning state was previously
                ## scheduled with a Scheduler with more learning_steps than the current Scheduler
                if len(self.learning_steps) == 0 or (
                    card.step >= len(self.learning_steps)
                    and rating in (Rating.Hard, Rating.Good, Rating.Easy)
                ):
                    card.state = State.Review
                    card.step = None

                    next_interval_days = self._next_interval(stability=card.stability)
                    next_interval = timedelta(days=next_interval_days)

                else:
                    match rating:
                        case Rating.Again:
                            card.step = 0
                            next_interval = self.learning_steps[card.step]

                        case Rating.Hard:
                            # card step stays the same

                            if card.step == 0 and len(self.learning_steps) == 1:
                                next_interval = self.learning_steps[0] * 1.5
                            elif card.step == 0 and len(self.learning_steps) >= 2:
                                next_interval = (
                                    self.learning_steps[0] + self.learning_steps[1]
                                ) / 2.0
                            else:
                                next_interval = self.learning_steps[card.step]

                        case Rating.Good:
                            if card.step + 1 == len(
                                self.learning_steps
                            ):  # the last step
                                card.state = State.Review
                                card.step = None

                                next_interval_days = self._next_interval(
                                    stability=card.stability
                                )
                                next_interval = timedelta(days=next_interval_days)

                            else:
                                card.step += 1
                                next_interval = self.learning_steps[card.step]

                        case Rating.Easy:
                            card.state = State.Review
                            card.step = None

                            next_interval_days = self._next_interval(
                                stability=card.stability
                            )
                            next_interval = timedelta(days=next_interval_days)

            case State.Review:
                # update the card's stability and difficulty
                if days_since_last_review is not None and days_since_last_review < 1:
                    card.stability = self._short_term_stability(
                        stability=card.stability, rating=rating
                    )
                    card.difficulty = self._next_difficulty(
                        difficulty=card.difficulty, rating=rating
                    )

                else:
                    card.stability = self._next_stability(
                        difficulty=card.difficulty,
                        stability=card.stability,
                        retrievability=self.get_card_retrievability(
                            card,
                            current_datetime=review_datetime,
                        ),
                        rating=rating,
                    )
                    card.difficulty = self._next_difficulty(
                        difficulty=card.difficulty, rating=rating
                    )

                # calculate the card's next interval
                match rating:
                    case Rating.Again:
                        # if there are no relearning steps (they were left blank)
                        if len(self.relearning_steps) == 0:
                            next_interval_days = self._next_interval(
                                stability=card.stability
                            )
                            next_interval = timedelta(days=next_interval_days)

                        else:
                            card.state = State.Relearning
                            card.step = 0

                            next_interval = self.relearning_steps[card.step]

                    case Rating.Hard | Rating.Good | Rating.Easy:
                        next_interval_days = self._next_interval(
                            stability=card.stability
                        )
                        next_interval = timedelta(days=next_interval_days)

            case State.Relearning:
                # update the card's stability and difficulty
                if days_since_last_review is not None and days_since_last_review < 1:
                    card.stability = self._short_term_stability(
                        stability=card.stability, rating=rating
                    )
                    card.difficulty = self._next_difficulty(
                        difficulty=card.difficulty, rating=rating
                    )

                else:
                    card.stability = self._next_stability(
                        difficulty=card.difficulty,
                        stability=card.stability,
                        retrievability=card.get_retrievability(
                            scheduler_parameters=self.parameters,
                            current_datetime=review_datetime,
                        ),
                        rating=rating,
                    )
                    card.difficulty = self._next_difficulty(
                        difficulty=card.difficulty, rating=rating
                    )

                # calculate the card's next interval
                ## first if-clause handles edge case where the Card in the Relearning state was previously
                ## scheduled with a Scheduler with more relearning_steps than the current Scheduler
                if len(self.relearning_steps) == 0 or (
                    card.step >= len(self.relearning_steps)
                    and rating in (Rating.Hard, Rating.Good, Rating.Easy)
                ):
                    card.state = State.Review
                    card.step = None

                    next_interval_days = self._next_interval(stability=card.stability)
                    next_interval = timedelta(days=next_interval_days)

                else:
                    match rating:
                        case Rating.Again:
                            card.step = 0
                            next_interval = self.relearning_steps[card.step]

                        case Rating.Hard:
                            # card step stays the same

                            if card.step == 0 and len(self.relearning_steps) == 1:
                                next_interval = self.relearning_steps[0] * 1.5
                            elif card.step == 0 and len(self.relearning_steps) >= 2:
                                next_interval = (
                                    self.relearning_steps[0] + self.relearning_steps[1]
                                ) / 2.0
                            else:
                                next_interval = self.relearning_steps[card.step]

                        case Rating.Good:
                            if card.step + 1 == len(
                                self.relearning_steps
                            ):  # the last step
                                card.state = State.Review
                                card.step = None

                                next_interval_days = self._next_interval(
                                    stability=card.stability
                                )
                                next_interval = timedelta(days=next_interval_days)

                            else:
                                card.step += 1
                                next_interval = self.relearning_steps[card.step]

                        case Rating.Easy:
                            card.state = State.Review
                            card.step = None

                            next_interval_days = self._next_interval(
                                stability=card.stability
                            )
                            next_interval = timedelta(days=next_interval_days)

        if self.enable_fuzzing and card.state == State.Review:
            next_interval = self._get_fuzzed_interval(next_interval)

        card.due = review_datetime + next_interval
        card.last_review = review_datetime

        review_log = ReviewLog(
            card_id=card.card_id,
            rating=rating,
            review_datetime=review_datetime,
            review_duration=review_duration,
        )

        return card, review_log

    def to_dict(
        self,
    ) -> dict[str, list | float | int | bool]:
        """
        Returns a JSON-serializable dictionary representation of the Scheduler object.

        This method is specifically useful for storing Scheduler objects in a database.

        Returns:
            A dictionary representation of the Scheduler object.
        """

        return_dict = {
            "parameters": list(self.parameters),
            "desired_retention": self.desired_retention,
            "learning_steps": [
                int(learning_step.total_seconds())
                for learning_step in self.learning_steps
            ],
            "relearning_steps": [
                int(relearning_step.total_seconds())
                for relearning_step in self.relearning_steps
            ],
            "maximum_interval": self.maximum_interval,
            "enable_fuzzing": self.enable_fuzzing,
        }

        return return_dict

    @staticmethod
    def from_dict(source_dict: dict[str, list | float | int | bool]) -> Scheduler:
        """
        Creates a Scheduler object from an existing dictionary.

        Args:
            source_dict: A dictionary representing an existing Scheduler object.

        Returns:
            A Scheduler object created from the provided dictionary.
        """

        parameters = source_dict["parameters"]
        desired_retention = source_dict["desired_retention"]
        learning_steps = [
            timedelta(seconds=learning_step)
            for learning_step in source_dict["learning_steps"]
        ]
        relearning_steps = [
            timedelta(seconds=relearning_step)
            for relearning_step in source_dict["relearning_steps"]
        ]
        maximum_interval = source_dict["maximum_interval"]
        enable_fuzzing = source_dict["enable_fuzzing"]

        return Scheduler(
            parameters=parameters,
            desired_retention=desired_retention,
            learning_steps=learning_steps,
            relearning_steps=relearning_steps,
            maximum_interval=maximum_interval,
            enable_fuzzing=enable_fuzzing,
        )

    def _clamp_difficulty(self, difficulty: float) -> float:
        if isinstance(difficulty, (float, int)):
            difficulty = min(max(difficulty, 1.0), 10.0)
        else:  # type(difficulty) is torch.Tensor
            difficulty = difficulty.clamp(min=1.0, max=10.0)

        return difficulty

    def _clamp_stability(self, stability: float) -> float:
        if isinstance(stability, (float, int)):
            stability = max(stability, STABILITY_MIN)
        else:  # type(stability) is torch.Tensor
            stability = stability.clamp(min=STABILITY_MIN)

        return stability

    def _initial_stability(self, rating: Rating) -> float:
        initial_stability = self.parameters[rating - 1]

        initial_stability = self._clamp_stability(initial_stability)

        return initial_stability

    def _initial_difficulty(self, rating: Rating) -> float:
        initial_difficulty = (
            self.parameters[4] - (math.e ** (self.parameters[5] * (rating - 1))) + 1
        )

        initial_difficulty = self._clamp_difficulty(initial_difficulty)

        return initial_difficulty

    def _next_interval(self, stability: float) -> int:
        next_interval = (stability / self._FACTOR) * (
            (self.desired_retention ** (1 / self._DECAY)) - 1
        )

        next_interval = round(float(next_interval))  # intervals are full days

        # must be at least 1 day long
        next_interval = max(next_interval, 1)

        # can not be longer than the maximum interval
        next_interval = min(next_interval, self.maximum_interval)

        return next_interval

    def _short_term_stability(self, stability: float, rating: Rating) -> float:
        short_term_stability_increase = (
            math.e ** (self.parameters[17] * (rating - 3 + self.parameters[18]))
        ) * (stability ** -self.parameters[19])

        if rating in (Rating.Good, Rating.Easy):
            if isinstance(short_term_stability_increase, (float, int)):
                short_term_stability_increase = max(short_term_stability_increase, 1.0)
            else:  # type(short_term_stability_increase) is torch.Tensor
                short_term_stability_increase = short_term_stability_increase.clamp(
                    min=1.0
                )

        short_term_stability = stability * short_term_stability_increase

        short_term_stability = self._clamp_stability(short_term_stability)

        return short_term_stability

    def _next_difficulty(self, difficulty: float, rating: Rating) -> float:
        def _linear_damping(delta_difficulty: float, difficulty: float) -> float:
            return (10.0 - difficulty) * delta_difficulty / 9.0

        def _mean_reversion(arg_1: float, arg_2: float) -> float:
            return self.parameters[7] * arg_1 + (1 - self.parameters[7]) * arg_2

        arg_1 = self._initial_difficulty(Rating.Easy)

        delta_difficulty = -(self.parameters[6] * (rating - 3))
        arg_2 = difficulty + _linear_damping(
            delta_difficulty=delta_difficulty, difficulty=difficulty
        )

        next_difficulty = _mean_reversion(arg_1=arg_1, arg_2=arg_2)

        next_difficulty = self._clamp_difficulty(next_difficulty)

        return next_difficulty

    def _next_stability(
        self, difficulty: float, stability: float, retrievability: float, rating: Rating
    ) -> float:
        if rating == Rating.Again:
            next_stability = self._next_forget_stability(
                difficulty=difficulty,
                stability=stability,
                retrievability=retrievability,
            )

        elif rating in (Rating.Hard, Rating.Good, Rating.Easy):
            next_stability = self._next_recall_stability(
                difficulty=difficulty,
                stability=stability,
                retrievability=retrievability,
                rating=rating,
            )

        next_stability = self._clamp_stability(next_stability)

        return next_stability

    def _next_forget_stability(
        self, difficulty: float, stability: float, retrievability: float
    ) -> float:
        next_forget_stability_long_term_params = (
            self.parameters[11]
            * (difficulty ** -self.parameters[12])
            * (((stability + 1) ** (self.parameters[13])) - 1)
            * (math.e ** ((1 - retrievability) * self.parameters[14]))
        )

        next_forget_stability_short_term_params = stability / (
            math.e ** (self.parameters[17] * self.parameters[18])
        )

        return min(
            next_forget_stability_long_term_params,
            next_forget_stability_short_term_params,
        )

    def _next_recall_stability(
        self, difficulty: float, stability: float, retrievability: float, rating: Rating
    ) -> float:
        hard_penalty = self.parameters[15] if rating == Rating.Hard else 1
        easy_bonus = self.parameters[16] if rating == Rating.Easy else 1

        return stability * (
            1
            + (math.e ** (self.parameters[8]))
            * (11 - difficulty)
            * (stability ** -self.parameters[9])
            * ((math.e ** ((1 - retrievability) * self.parameters[10])) - 1)
            * hard_penalty
            * easy_bonus
        )

    def _get_fuzzed_interval(self, interval: timedelta) -> timedelta:
        """
        Takes the current calculated interval and adds a small amount of random fuzz to it.
        For example, a card that would've been due in 50 days, after fuzzing, might be due in 49, or 51 days.

        Args:
            interval: The calculated next interval, before fuzzing.

        Returns:
            The new interval, after fuzzing.
        """

        interval_days = interval.days

        if interval_days < 2.5:  # fuzz is not applied to intervals less than 2.5
            return interval

        def _get_fuzz_range(interval_days: int) -> tuple[int, int]:
            """
            Helper function that computes the possible upper and lower bounds of the interval after fuzzing.
            """

            delta = 1.0
            for fuzz_range in FUZZ_RANGES:
                delta += fuzz_range["factor"] * max(
                    min(interval_days, fuzz_range["end"]) - fuzz_range["start"], 0.0
                )

            min_ivl = int(round(interval_days - delta))
            max_ivl = int(round(interval_days + delta))

            # make sure the min_ivl and max_ivl fall into a valid range
            min_ivl = max(2, min_ivl)
            max_ivl = min(max_ivl, self.maximum_interval)
            min_ivl = min(min_ivl, max_ivl)

            return min_ivl, max_ivl

        min_ivl, max_ivl = _get_fuzz_range(interval_days)

        fuzzed_interval_days = (
            random() * (max_ivl - min_ivl + 1)
        ) + min_ivl  # the next interval is a random value between min_ivl and max_ivl

        fuzzed_interval_days = min(round(fuzzed_interval_days), self.maximum_interval)

        fuzzed_interval = timedelta(days=fuzzed_interval_days)

        return fuzzed_interval

"""
fsrs.optimizer
---------

This module defines the optional Optimizer class.
"""

import math
import sys
import json
from datetime import datetime, timezone
from copy import deepcopy
from random import Random
from statistics import mean

try:
    import torch
    from torch.nn import BCELoss
    from torch import optim
    import pandas as pd

    # weight clipping
    INIT_S_MAX = 100.0
    lower_bounds = torch.tensor(
        [
            STABILITY_MIN,
            STABILITY_MIN,
            STABILITY_MIN,
            STABILITY_MIN,
            1.0,
            0.1,
            0.1,
            0.0,
            0.0,
            0.0,
            0.01,
            0.1,
            0.01,
            0.01,
            0.01,
            0.0,
            1.0,
            0.0,
            0.0,
            0.0,
            0.1,
        ],
        dtype=torch.float64,
    )
    upper_bounds = torch.tensor(
        [
            INIT_S_MAX,
            INIT_S_MAX,
            INIT_S_MAX,
            INIT_S_MAX,
            10.0,
            4.0,
            4.0,
            0.75,
            4.5,
            0.8,
            3.5,
            5.0,
            0.25,
            0.9,
            4.0,
            1.0,
            6.0,
            2.0,
            2.0,
            0.8,
            0.8,
        ],
        dtype=torch.float64,
    )

    # hyper parameters
    num_epochs = 5
    mini_batch_size = 512
    learning_rate = 4e-2
    max_seq_len = (
        64  # up to the first 64 reviews of each card are used for optimization
    )

    class Optimizer:
        """
        The FSRS optimizer.

        Enables the optimization of FSRS scheduler parameters from existing review logs for more accurate interval calculations.

        Attributes:
            review_logs: A collection of previous ReviewLog objects from a user.
            _revlogs_train: The collection of review logs, sorted and formatted for optimization.
        """

        review_logs: tuple[ReviewLog, ...]
        _revlogs_train: dict

        def __init__(
            self, review_logs: tuple[ReviewLog, ...] | list[ReviewLog]
        ) -> None:
            """
            Initializes the Optimizer with a set of ReviewLogs. Also formats a copy of the review logs for optimization.

            Note that the ReviewLogs provided by the user don't need to be in order.
            """

            def _format_revlogs() -> dict:
                """
                Sorts and converts the tuple of ReviewLog objects to a dictionary format for optimizing
                """

                revlogs_train = {}
                for review_log in self.review_logs:
                    # pull data out of current ReviewLog object
                    card_id = review_log.card_id
                    rating = review_log.rating
                    review_datetime = review_log.review_datetime
                    review_duration = review_log.review_duration

                    # if the card was rated Again, it was not recalled
                    recall = 0 if rating == Rating.Again else 1

                    # as a ML problem, [x, y] = [ [review_datetime, rating, review_duration], recall ]
                    datum = [[review_datetime, rating, review_duration], recall]

                    if card_id not in revlogs_train:
                        revlogs_train[card_id] = []

                    revlogs_train[card_id].append((datum))
                    revlogs_train[card_id] = sorted(
                        revlogs_train[card_id], key=lambda x: x[0][0]
                    )  # keep reviews sorted

                # sort the dictionary in order of when each card history starts
                revlogs_train = dict(sorted(revlogs_train.items()))

                return revlogs_train

            self.review_logs = deepcopy(tuple(review_logs))

            # format the ReviewLog data for optimization
            self._revlogs_train = _format_revlogs()

        def _compute_batch_loss(self, parameters: list[float]) -> float:
            """
            Computes the current total loss for the entire batch of review logs.
            """

            card_ids = list(self._revlogs_train.keys())
            params = torch.tensor(parameters, dtype=torch.float64)
            loss_fn = BCELoss()
            scheduler = Scheduler(parameters=params)
            step_losses = []

            for card_id in card_ids:
                card_review_history = self._revlogs_train[card_id][:max_seq_len]

                for i in range(len(card_review_history)):
                    review = card_review_history[i]

                    x_date = review[0][0]
                    y_retrievability = review[1]
                    u_rating = review[0][1]

                    if i == 0:
                        card = Card(card_id=card_id, due=x_date)

                    y_pred_retrievability = scheduler.get_card_retrievability(
                        card=card, current_datetime=x_date
                    )
                    y_retrievability = torch.tensor(
                        y_retrievability, dtype=torch.float64
                    )

                    if card.last_review and (x_date - card.last_review).days > 0:
                        step_loss = loss_fn(y_pred_retrievability, y_retrievability)
                        step_losses.append(step_loss)

                    card, _ = scheduler.review_card(
                        card=card,
                        rating=u_rating,
                        review_datetime=x_date,
                        review_duration=None,
                    )

            batch_loss = torch.sum(torch.stack(step_losses))
            batch_loss = batch_loss.item() / len(step_losses)

            return batch_loss

        def compute_optimal_parameters(self) -> list[float]:
            """
            Computes a set of optimized parameters for the FSRS scheduler and returns it as a list of floats.

            High level explanation of optimization:
            ---------------------------------------
            FSRS is a many-to-many sequence model where the "State" at each step is a Card object at a given point in time,
            the input is the time of the review and the output is the predicted retrievability of the card at the time of review.

            Each card's review history can be thought of as a sequence, each review as a step and each collection of card review histories
            as a batch.

            The loss is computed by comparing the predicted retrievability of the Card at each step with whether the Card was actually
            sucessfully recalled or not (0/1).

            Finally, the card objects at each step in their sequences are updated using the current parameters of the Scheduler
            as well as the rating given to that card by the user. The parameters of the Scheduler is what is being optimized.
            """

            def _num_reviews() -> int:
                """
                Computes how many Review-state reviews there are in the dataset.
                Only the loss from Review-state reviews count for optimization and their number must
                be computed in advance to properly initialize the Cosine Annealing learning rate scheduler.
                """

                scheduler = Scheduler()
                num_reviews = 0
                # iterate through the card review histories
                card_ids = list(self._revlogs_train.keys())
                for card_id in card_ids:
                    card_review_history = self._revlogs_train[card_id][:max_seq_len]

                    # iterate through the current Card's review history
                    for i in range(len(card_review_history)):
                        review = card_review_history[i]

                        review_datetime = review[0][0]
                        rating = review[0][1]

                        # if this is the first review, create the Card object
                        if i == 0:
                            card = Card(card_id=card_id, due=review_datetime)

                        # only non-same-day reviews count
                        if (
                            card.last_review
                            and (review_datetime - card.last_review).days > 0
                        ):
                            num_reviews += 1

                        card, _ = scheduler.review_card(
                            card=card,
                            rating=rating,
                            review_datetime=review_datetime,
                            review_duration=None,
                        )

                return num_reviews

            def _update_parameters(
                step_losses: list,
                adam_optimizer: torch.optim.Adam,
                params: torch.Tensor,
                lr_scheduler: torch.optim.lr_scheduler.CosineAnnealingLR,
            ) -> None:
                """
                Computes and updates the current FSRS parameters based on the step losses. Also updates the learning rate scheduler.
                """

                # Backpropagate through the loss
                mini_batch_loss = torch.sum(torch.stack(step_losses))
                adam_optimizer.zero_grad()  # clear previous gradients
                mini_batch_loss.backward()  # compute gradients
                adam_optimizer.step()  # Update parameters

                # clamp the weights in place without modifying the computational graph
                with torch.no_grad():
                    params.clamp_(min=lower_bounds, max=upper_bounds)

                # update the learning rate
                lr_scheduler.step()

            # set local random seed for reproducibility
            rng = Random(42)

            card_ids = list(self._revlogs_train.keys())

            num_reviews = _num_reviews()

            if num_reviews < mini_batch_size:
                return list(DEFAULT_PARAMETERS)

            # Define FSRS Scheduler parameters as torch tensors with gradients
            params = torch.tensor(
                DEFAULT_PARAMETERS, requires_grad=True, dtype=torch.float64
            )

            loss_fn = BCELoss()
            adam_optimizer = optim.Adam([params], lr=learning_rate)
            lr_scheduler = optim.lr_scheduler.CosineAnnealingLR(
                optimizer=adam_optimizer,
                T_max=math.ceil(num_reviews / mini_batch_size) * num_epochs,
            )

            best_params = None
            best_loss = math.inf
            # iterate through the epochs
            for j in range(num_epochs):
                # randomly shuffle the order of which Card's review histories get computed first
                # at the beginning of each new epoch
                rng.shuffle(card_ids)

                # initialize new scheduler with updated parameters each epoch
                scheduler = Scheduler(parameters=params)

                # stores the computed loss of each individual review
                step_losses = []

                # iterate through the card review histories (sequences)
                for card_id in card_ids:
                    card_review_history = self._revlogs_train[card_id][:max_seq_len]

                    # iterate through the current Card's review history (steps)
                    for i in range(len(card_review_history)):
                        review = card_review_history[i]

                        # input
                        x_date = review[0][0]
                        # target
                        y_retrievability = review[1]
                        # update
                        u_rating = review[0][1]

                        # if this is the first review, create the Card object
                        if i == 0:
                            card = Card(card_id=card_id, due=x_date)

                        # predicted target
                        y_pred_retrievability = scheduler.get_card_retrievability(
                            card=card, current_datetime=x_date
                        )
                        y_retrievability = torch.tensor(
                            y_retrievability, dtype=torch.float64
                        )

                        # only compute step-loss on non-same-day reviews
                        if card.last_review and (x_date - card.last_review).days > 0:
                            step_loss = loss_fn(y_pred_retrievability, y_retrievability)
                            step_losses.append(step_loss)

                        # update the card's state
                        card, _ = scheduler.review_card(
                            card=card,
                            rating=u_rating,
                            review_datetime=x_date,
                            review_duration=None,
                        )

                        # take a gradient step after each mini-batch
                        if len(step_losses) == mini_batch_size:
                            _update_parameters(
                                step_losses=step_losses,
                                adam_optimizer=adam_optimizer,
                                params=params,
                                lr_scheduler=lr_scheduler,
                            )

                            # update the scheduler's with the new parameters
                            scheduler = Scheduler(parameters=params)
                            # clear the step losses for next batch
                            step_losses = []

                            # remove gradient history from tensor card parameters for next batch
                            card.stability = card.stability.detach()
                            card.difficulty = card.difficulty.detach()

                # update params on remaining review logs
                if len(step_losses) > 0:
                    _update_parameters(
                        step_losses=step_losses,
                        adam_optimizer=adam_optimizer,
                        params=params,
                        lr_scheduler=lr_scheduler,
                    )

                # compute the current batch loss after each epoch
                detached_params = [
                    x.detach().item() for x in list(params.detach())
                ]  # convert to floats
                with torch.no_grad():
                    epoch_batch_loss = self._compute_batch_loss(
                        parameters=detached_params
                    )

                # if the batch loss is better with the current parameters, update the current best parameters
                if epoch_batch_loss < best_loss:
                    best_loss = epoch_batch_loss
                    best_params = detached_params

            return best_params

        def _compute_probs_and_costs(self) -> dict[str, float]:
            review_log_df = pd.DataFrame(
                vars(review_log) for review_log in self.review_logs
            )

            review_log_df = review_log_df.sort_values(
                by=["card_id", "review_datetime"], ascending=[True, True]
            ).reset_index(drop=True)

            # dictionary to return
            probs_and_costs_dict = {}

            # compute the probabilities and costs of the first rating
            first_reviews_df = review_log_df.loc[
                ~review_log_df["card_id"].duplicated(keep="first")
            ].reset_index(drop=True)

            first_again_reviews_df = first_reviews_df.loc[
                first_reviews_df["rating"] == Rating.Again
            ]
            first_hard_reviews_df = first_reviews_df.loc[
                first_reviews_df["rating"] == Rating.Hard
            ]
            first_good_reviews_df = first_reviews_df.loc[
                first_reviews_df["rating"] == Rating.Good
            ]
            first_easy_reviews_df = first_reviews_df.loc[
                first_reviews_df["rating"] == Rating.Easy
            ]

            # compute the probability of the user clicking again/hard/good/easy given it's their first review
            num_first_again = len(first_again_reviews_df)
            num_first_hard = len(first_hard_reviews_df)
            num_first_good = len(first_good_reviews_df)
            num_first_easy = len(first_easy_reviews_df)

            num_first_review = (
                num_first_again + num_first_hard + num_first_good + num_first_easy
            )

            prob_first_again = num_first_again / num_first_review
            prob_first_hard = num_first_hard / num_first_review
            prob_first_good = num_first_good / num_first_review
            prob_first_easy = num_first_easy / num_first_review

            probs_and_costs_dict["prob_first_again"] = prob_first_again
            probs_and_costs_dict["prob_first_hard"] = prob_first_hard
            probs_and_costs_dict["prob_first_good"] = prob_first_good
            probs_and_costs_dict["prob_first_easy"] = prob_first_easy

            # compute the cost of the user clicking again/hard/good/easy on their first review
            first_again_review_durations = list(
                first_again_reviews_df["review_duration"]
            )
            first_hard_review_durations = list(first_hard_reviews_df["review_duration"])
            first_good_review_durations = list(first_good_reviews_df["review_duration"])
            first_easy_review_durations = list(first_easy_reviews_df["review_duration"])

            avg_first_again_review_duration = (
                mean(first_again_review_durations)
                if first_again_review_durations
                else 0
            )
            avg_first_hard_review_duration = (
                mean(first_hard_review_durations) if first_hard_review_durations else 0
            )
            avg_first_good_review_duration = (
                mean(first_good_review_durations) if first_good_review_durations else 0
            )
            avg_first_easy_review_duration = (
                mean(first_easy_review_durations) if first_easy_review_durations else 0
            )

            probs_and_costs_dict["avg_first_again_review_duration"] = (
                avg_first_again_review_duration
            )
            probs_and_costs_dict["avg_first_hard_review_duration"] = (
                avg_first_hard_review_duration
            )
            probs_and_costs_dict["avg_first_good_review_duration"] = (
                avg_first_good_review_duration
            )
            probs_and_costs_dict["avg_first_easy_review_duration"] = (
                avg_first_easy_review_duration
            )

            # compute the probabilities and costs of non-first ratings
            non_first_reviews_df = review_log_df.loc[
                review_log_df["card_id"].duplicated(keep="first")
            ].reset_index(drop=True)

            again_reviews_df = non_first_reviews_df.loc[
                non_first_reviews_df["rating"] == Rating.Again
            ]
            hard_reviews_df = non_first_reviews_df.loc[
                non_first_reviews_df["rating"] == Rating.Hard
            ]
            good_reviews_df = non_first_reviews_df.loc[
                non_first_reviews_df["rating"] == Rating.Good
            ]
            easy_reviews_df = non_first_reviews_df.loc[
                non_first_reviews_df["rating"] == Rating.Easy
            ]

            # compute the probability of the user clicking hard/good/easy given they correctly recalled the card
            num_hard = len(hard_reviews_df)
            num_good = len(good_reviews_df)
            num_easy = len(easy_reviews_df)

            num_recall = num_hard + num_good + num_easy

            prob_hard = num_hard / num_recall
            prob_good = num_good / num_recall
            prob_easy = num_easy / num_recall

            probs_and_costs_dict["prob_hard"] = prob_hard
            probs_and_costs_dict["prob_good"] = prob_good
            probs_and_costs_dict["prob_easy"] = prob_easy

            again_review_durations = list(again_reviews_df["review_duration"])
            hard_review_durations = list(hard_reviews_df["review_duration"])
            good_review_durations = list(good_reviews_df["review_duration"])
            easy_review_durations = list(easy_reviews_df["review_duration"])

            avg_again_review_duration = (
                mean(again_review_durations) if again_review_durations else 0
            )
            avg_hard_review_duration = (
                mean(hard_review_durations) if hard_review_durations else 0
            )
            avg_good_review_duration = (
                mean(good_review_durations) if good_review_durations else 0
            )
            avg_easy_review_duration = (
                mean(easy_review_durations) if easy_review_durations else 0
            )

            probs_and_costs_dict["avg_again_review_duration"] = (
                avg_again_review_duration
            )
            probs_and_costs_dict["avg_hard_review_duration"] = avg_hard_review_duration
            probs_and_costs_dict["avg_good_review_duration"] = avg_good_review_duration
            probs_and_costs_dict["avg_easy_review_duration"] = avg_easy_review_duration

            return probs_and_costs_dict

        def _simulate_cost(
            self,
            desired_retention: float,
            parameters: tuple[float, ...] | list[float],
            num_cards_simulate: int,
            probs_and_costs_dict: dict[str, float],
        ) -> float:
            rng = Random(42)

            # simulate from the beginning of 2025 till before the beginning of 2026
            start_date = datetime(2025, 1, 1, 0, 0, 0, 0, timezone.utc)
            end_date = datetime(2026, 1, 1, 0, 0, 0, 0, timezone.utc)

            scheduler = Scheduler(
                parameters=parameters,
                desired_retention=desired_retention,
                enable_fuzzing=False,
            )

            # unpack probs_and_costs_dict
            prob_first_again = probs_and_costs_dict["prob_first_again"]
            prob_first_hard = probs_and_costs_dict["prob_first_hard"]
            prob_first_good = probs_and_costs_dict["prob_first_good"]
            prob_first_easy = probs_and_costs_dict["prob_first_easy"]

            avg_first_again_review_duration = probs_and_costs_dict[
                "avg_first_again_review_duration"
            ]
            avg_first_hard_review_duration = probs_and_costs_dict[
                "avg_first_hard_review_duration"
            ]
            avg_first_good_review_duration = probs_and_costs_dict[
                "avg_first_good_review_duration"
            ]
            avg_first_easy_review_duration = probs_and_costs_dict[
                "avg_first_easy_review_duration"
            ]

            prob_hard = probs_and_costs_dict["prob_hard"]
            prob_good = probs_and_costs_dict["prob_good"]
            prob_easy = probs_and_costs_dict["prob_easy"]

            avg_again_review_duration = probs_and_costs_dict[
                "avg_again_review_duration"
            ]
            avg_hard_review_duration = probs_and_costs_dict["avg_hard_review_duration"]
            avg_good_review_duration = probs_and_costs_dict["avg_good_review_duration"]
            avg_easy_review_duration = probs_and_costs_dict["avg_easy_review_duration"]

            simulation_cost = 0
            for i in range(num_cards_simulate):
                card = Card()
                curr_date = start_date
                while curr_date < end_date:
                    # the card is new
                    if curr_date == start_date:
                        rating = rng.choices(
                            [Rating.Again, Rating.Hard, Rating.Good, Rating.Easy],
                            weights=[
                                prob_first_again,
                                prob_first_hard,
                                prob_first_good,
                                prob_first_easy,
                            ],
                        )[0]

                        if rating == Rating.Again:
                            simulation_cost += avg_first_again_review_duration

                        elif rating == Rating.Hard:
                            simulation_cost += avg_first_hard_review_duration

                        elif rating == Rating.Good:
                            simulation_cost += avg_first_good_review_duration

                        elif rating == Rating.Easy:
                            simulation_cost += avg_first_easy_review_duration

                    # the card is not new
                    else:
                        rating = rng.choices(
                            ["recall", Rating.Again],
                            weights=[desired_retention, 1.0 - desired_retention],
                        )[0]

                        if rating == "recall":
                            # compute probability that the user chose hard/good/easy, GIVEN that they correctly recalled the card
                            rating = rng.choices(
                                [Rating.Hard, Rating.Good, Rating.Easy],
                                weights=[prob_hard, prob_good, prob_easy],
                            )[0]

                        if rating == Rating.Again:
                            simulation_cost += avg_again_review_duration

                        elif rating == Rating.Hard:
                            simulation_cost += avg_hard_review_duration

                        elif rating == Rating.Good:
                            simulation_cost += avg_good_review_duration

                        elif rating == Rating.Easy:
                            simulation_cost += avg_easy_review_duration

                    card, _ = scheduler.review_card(
                        card=card, rating=rating, review_datetime=curr_date
                    )
                    curr_date = card.due

            total_knowledge = desired_retention * num_cards_simulate
            simulation_cost = simulation_cost / total_knowledge

            return simulation_cost

        def compute_optimal_retention(
            self, parameters: tuple[float, ...] | list[float]
        ) -> list[float]:
            def _validate_review_logs() -> None:
                if len(self.review_logs) < 512:
                    raise ValueError(
                        "Not enough ReviewLog's: at least 512 ReviewLog objects are required to compute optimal retention"
                    )

                for review_log in self.review_logs:
                    if review_log.review_duration is None:
                        raise ValueError(
                            "ReviewLog.review_duration cannot be None when computing optimal retention"
                        )

            _validate_review_logs()

            NUM_CARDS_SIMULATE = 1000
            DESIRED_RETENTIONS = [0.7, 0.75, 0.8, 0.85, 0.9, 0.95]

            probs_and_costs_dict = self._compute_probs_and_costs()

            simulation_costs = []
            for desired_retention in DESIRED_RETENTIONS:
                simulation_cost = self._simulate_cost(
                    desired_retention=desired_retention,
                    parameters=parameters,
                    num_cards_simulate=NUM_CARDS_SIMULATE,
                    probs_and_costs_dict=probs_and_costs_dict,
                )
                simulation_costs.append(simulation_cost)

            min_index = simulation_costs.index(min(simulation_costs))
            optimal_retention = DESIRED_RETENTIONS[min_index]

            return optimal_retention

except ImportError:

    class Optimizer:
        def __init__(self, *args, **kwargs) -> None:
            raise ImportError("The Optimizer class requires torch be installed.")

if __name__ == "__main__":
    import sys
    import json

    # Read review logs from stdin
    review_logs_data = json.loads(sys.stdin.read())

    # Convert review logs data to ReviewLog objects
    review_logs = []
    for log in review_logs_data:
        review_log = ReviewLog(
            card_id=log['card_id'],
            rating=Rating(log['rating']),
            review_datetime=datetime.fromisoformat(log['review_datetime']),
            review_duration=log['review_duration']
        )
        review_logs.append(review_log)

    # Skip optimization if there are not enough review logs
    if len(review_logs) < 10:
        print(json.dumps(list(DEFAULT_PARAMETERS)))
        sys.exit(0)

    # Optimize parameters
    optimizer = Optimizer(review_logs)
    optimized_parameters = optimizer.compute_optimal_parameters()

    # Return optimized parameters as JSON
    print(json.dumps(optimized_parameters))
    sys.exit(0)