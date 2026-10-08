"""Subtle native Manim vector calibration overlays; independent of GPU mesh."""
from manim import (
    BLACK, BLUE_E, WHITE, Arc, Create, FadeIn, FadeOut, Line, Scene,
    VGroup, config, linear
)

# Render at half resolution for CPU economy; FFmpeg scales to 1080x1920.
# Full 15 seconds at 30fps; black pixels are optically transparent using
# FFmpeg screen blend (not used as replacement GPU imagery).
config.pixel_width = 540
config.pixel_height = 960
config.frame_width = 9
config.frame_height = 16
config.frame_rate = 30
config.background_color = BLACK

class TechnicalGuides(Scene):
    def construct(self):
        soft = "#52616F"
        white = "#8995A0"
        # 2 small engineering register marks in the footer side margin.
        # The 3D product occupies the central section, well above these.
        marks = VGroup(
            Line([-3.80, -6.80, 0], [-3.35, -6.80, 0], color=soft, stroke_width=1.4),
            Line([-3.80, -6.80, 0], [-3.80, -6.38, 0], color=soft, stroke_width=1.4),
            Line([ 3.80, -6.80, 0], [ 3.35, -6.80, 0], color=soft, stroke_width=1.4),
            Line([ 3.80, -6.80, 0], [ 3.80, -6.38, 0], color=soft, stroke_width=1.4),
        )
        marker = Arc(radius=.34, start_angle=.15, angle=2.0, color=white, stroke_width=1.5).move_to([-3.55, -6.58, 0])
        self.play(Create(marks), run_time=1.1)
        self.play(Create(marker), run_time=1.4)
        self.wait(5.5)
        self.play(FadeOut(marker), run_time=.8)
        self.wait(6.2)
