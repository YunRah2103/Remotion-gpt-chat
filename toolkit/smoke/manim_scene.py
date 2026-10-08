"""Original Manim motion proof: a rotating steering-direction arrow."""
from manim import *

class SteeringSmoke(Scene):
    def construct(self):
        ring = Circle(radius=1.1, color=GREEN)
        hub = Dot(radius=0.12, color=WHITE)
        arrow = Arrow(ORIGIN, RIGHT * 0.85, buff=0, color=YELLOW)
        self.add(ring, hub, arrow)
        self.play(Rotate(arrow, angle=PI / 4, about_point=ORIGIN), run_time=0.65)
        self.wait(0.35)
