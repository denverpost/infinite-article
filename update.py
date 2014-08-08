#!/usr/bin/env python
# Download an XML file, take its contents and turn it into a javascript file.
# FTP that javascript file to a server.
import httplib2
import sys
import string
import re
import os.path
from filewrapper.FileWrapper import FileWrapper

class ParseXml:
    """Takes XML, turns it into something else."""

    def __init__(self, fields, template):
        """ ..."""
        self.fields = self.set_fields(fields)
        self.template = self.set_template(template)
        self.output = ''

    def set_fields(self):
        """ Set the fields we're parsing out of each XML object item."""
        pass

    def set_template(self):
        """ Set the template file we're using for templating the XML output.
        The fieldnames of the template should match the XML field and attribute
        names. """
        pass

    def write_item(self):
        """ Marry the XML fields we're using to the template. Return a string."""
        pass

    

def main():
    """ What we execute when we execute from the command line."""
    slug = 'all'
    fh = FileWrapper('infinite-%s.js' % slug)

    # Get the XML
    fh_xml = FileWrapper('infinite-%s.xml' % slug)
    url = 'http://rss.denverpost.com/mngi/rss/CustomRssServlet/36/270501.xml'
    markup = fh_xml.request(url)
    fh_xml.write(markup)

    # Turn it into an object

    # Parse out the pieces we want.

    # Write those pieces to another file.

    # FTP that file to a production server.


if __name__ == '__main__':
    main()
