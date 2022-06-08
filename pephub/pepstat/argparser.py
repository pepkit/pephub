import argparse
from email.policy import default

from ubiquerg import VersionInHelpParser

from ._version import __version__
from .const import *


def build_argparser(desc):
    """
    Builds argument parser.
    :param str desc: additional description to print in help
    :return argparse.ArgumentParser
    """
    banner = "%(prog)s - report pipeline results"
    additional_description = desc
    parser = VersionInHelpParser(
        version=__version__, description=banner, epilog=additional_description
    )

    subparsers = parser.add_subparsers(dest="command")

    def add_subparser(cmd, msg):
        return subparsers.add_parser(
            cmd,
            description=msg,
            help=msg,
            formatter_class=lambda prog: argparse.HelpFormatter(
                prog, max_help_position=40, width=90
            ),
        )

    sps = {}
    sps[INDEX_CMD] = add_subparser(INDEX_CMD, "Index a repository of peps.")
    sps[INDEX_CMD].add_argument(
        "path", help="Path/URL to PEP repository."
    )
    sps[INDEX_CMD].add_argument(
        "-o", "--output", dest="output", help="Path to the output file.", default="index.yaml"
    )

    return parser
