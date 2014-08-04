#!/usr/bin/env python
# Download an XML file, take its contents and turn it into a javascript file.
# FTP that javascript file to a server.
import httplib2
import sys
import string
import re
import os.path
from FileWrapper import FileWrapper

class Update:
    """Updates the js file containing the five most-recent articles."""

    def __init__(self):
        pass


if __name__ == '__main__':
    slug = 'all'
    fh = FileWrapper('infinite-%s.js' % slug)

    # Get the XML
    fh_xml = FileWrapper('infinite-%s.xml' % slug)
    url = 'http://rss.denverpost.com/mngi/rss/CustomRssServlet/36/270501.xml'
    markup = fh_xml.request(url)
    fh_xml.write(markup)
    
