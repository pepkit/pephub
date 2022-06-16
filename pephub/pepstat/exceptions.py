import abc


class PEPstatError(Exception):
    """Base exception type for this package"""

    __metaclass__ = abc.ABCMeta


class UnknwownCommandError(PEPstatError):
    """Exception for unknown error called"""

    def __init__(self, msg):
        super(PEPstatError, self).__init__(msg)


class NamespaceNotFoundError(PEPstatError):
    """Exception for unknown namespace"""

    def __init__(self, msg):
        super(PEPstatError, self).__init__(msg)

class ProjectNotFoundError(PEPstatError):
    """Exception for unknown project"""

    def __init__(self, msg):
        super(PEPstatError, self).__init__(msg)