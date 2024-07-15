# from platform import python_version
#
# from fastapi import APIRouter, Depends, Request
# from fastapi.responses import JSONResponse, RedirectResponse
# from fastapi.templating import Jinja2Templates
# from pepdbagent import PEPDatabaseAgent
#
# from ...._version import __version__ as pephub_version
# from ....const import BASE_TEMPLATES_PATH
# from ....dependencies import get_db, read_authorization_header
#
# user = APIRouter(prefix="/api/v1/me", tags=["profile"])
#
# templates = Jinja2Templates(directory=BASE_TEMPLATES_PATH)
#
#
# # return users data from session_info
# @user.get("/")
# def profile_data(
#     session_info=Depends(read_authorization_header),
#     agent: PEPDatabaseAgent = Depends(get_db),
# ):
#     """
#     Return the user's profile data.
#     """
#     if session_info is None:
#         return RedirectResponse(url="/auth/login")
#     else:
#         peps = agent.namespace.get(
#             namespace=session_info["login"], admin=session_info["login"]
#         )
#         return JSONResponse(
#             content={
#                 "session_info": session_info,
#                 "peps": [pep.dict() for pep in peps.projects],
#             }
#         )
#
#
# @user.get("/data")
# def profile_data2(
#     request: Request,
#     session_info=Depends(read_authorization_header),
#     agent: PEPDatabaseAgent = Depends(get_db),
# ):
#     """
#     Return the user's profile data.
#     """
#     if session_info is None:
#         return RedirectResponse(url="/auth/login")
#     else:
#         peps = agent.namespace.get(
#             namespace=session_info["login"], admin=session_info["login"]
#         )
#         return {
#             "request": request,
#             "session_info": session_info,
#             "python_version": python_version(),
#             "pephub_version": pephub_version,
#             "logged_in": session_info is not None,
#             "peps": peps,
#         }
