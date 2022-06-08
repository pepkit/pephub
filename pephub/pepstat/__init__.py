# Project configuration, particularly for logging.

import logmuse

from ._version import __version__
from .pepstat import *
from .const import *

logmuse.init_logger(PKG_NAME)
