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

    def parse_xml(self):
        """ Parse out the fields we want from the markup."""
        tree = ET.fromstring(self.markup)

        results = []
        # What's that './/' in the findall() command? I don't know, but I know it
        # makes it possible to find child and subchild elements in an XML tree.
        for field in self.fields:
            items = tree.findall('.//%s' % field)
            for item in items:
                result = {}
                for subfield in self.fields[field]:
                    value = item.find('.//%s' % subfield).text
                    if value:
                        # We name the result field the value of subfield dict.
                        # The subfield dict key is the name of the field in the
                        # xml, and the key's value is the name of the field as
                        # we're storing it here (and, eventually, writing to the file).
                        # So, with a dict item such as
                        #             'updateDate': 'date_updated',
                        # the xml field name is 'updateDate', and the field name
                        # we're writing is 'date_updated'.
                        result[self.fields[field][subfield]] = value
                results += [result]
        return results

    def write_xml(self):
        """ Write each bit of the xml. """
        pass

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
    # We don't want to download the file every time while testing, thus, testing logic.
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
        'article': {    # This field name should be the same as the parent element.
            'cId': 'id',
            'launchDate': 'date_published',
            'updateDate': 'date_updated',
            'bylineEncoded': 'byline',
            'headline': 'title',
            'body': 'body',
            'overline': 'overline',
            'subHead': 'subtitle'
        }
    }
    template = {
        'header': 'var ar = new Array(',
        'item' : """
    {
        overline: '{{overline}}',
        title: '{{title}}',
        body: '{{body}}',
        byline: '{{byline}},
        path: { prefix: '/news/ci_', id: {{id}}, suffix: '' },
        date_published: '{{date_published}}',
        date_updated: '{{date_updated}}'
    }
    """,
        'footer': ');'
    }
    parser = ParseXml(markup, fields, template)
    print parser.parse_xml()


    # Parse out the pieces we want.

    # Write those pieces to another file.

    # FTP that file to a production server.


if __name__ == '__main__':
    main()
