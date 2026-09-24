# -*- coding: utf-8 -*-
"""Полная пересборка: python3 build.py"""
import runpy
runpy.run_path("build_data.py", run_name="__main__")
runpy.run_path("build_html.py", run_name="__main__")
