#!/usr/bin/env python
# Download an XML file, take its contents and turn it into a javascript file.
# FTP that javascript file to a server.
import httplib2
import sys
import string
import re
import os.path
import xml.etree.ElementTree as ET
from optparse import OptionParser
from filewrapper.FileWrapper import FileWrapper

class ParseXml:
    """Takes XML, turns it into something else."""

    def __init__(self, markup, fields, template):
        """ ..."""
        self.set_markup(markup)
        self.set_fields(fields)
        self.set_template(template)
        self.output = ''

    def set_markup(self, markup):
        """ Set the markup we're parsing."""
        self.markup = markup

    def set_fields(self, fields):
        """ Set the fields we're parsing out of each XML object item."""
        self.fields = fields

    def set_template(self, template):
        """ Set the template file we're using for templating the XML output.
        The fieldnames of the template should match the XML field and attribute
        names. """
        self.template = template

    def write_item(self):
        """ Marry the XML fields we're using to the template. Return a string."""
        pass

    

def main():
    """ What we execute when we execute from the command line."""
    parser = OptionParser()
    parser.add_option("-t", "--test", dest="test", action="store_true", default=False)
    (options, args) = parser.parse_args()
    slug = 'all'
    fh = FileWrapper('infinite-%s.js' % slug)

    # Get the XML
    fh_xml = FileWrapper('infinite-%s.xml' % slug)
    url = 'http://rss.denverpost.com/mngi/rss/CustomRssServlet/36/270501.xml'
    if options.test == True:
        if fh_xml.exists() == True:
            markup = fh_xml.read()
        else:
            markup = fh_xml.request(url)
        fh_xml.write(markup)
    else:
        markup = fh_xml.request(url)
    fh_xml.write(markup)

    # Turn it into an object
    fields = {
        'cId': 'id',
        'launchDate': 'date_published',
        'updateDate': 'date_updated',
        'bylineEncoded': 'byline',
        'headline': 'title',
        'body': 'body',
        'overline': 'overline',
        'subHead': 'subtitle'
    }



    # Parse out the pieces we want.

    # Write those pieces to another file.

    # FTP that file to a production server.


if __name__ == '__main__':
    main()
