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
from ftpwrapper.FtpWrapper import FtpWrapper

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
        """ Parse out the fields we want from the markup. Returns a list of objects.
            """
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
                    else:
                        result[self.fields[field][subfield]] = ''
                results += [result]
        self.results = results
        return results

    def write_xml(self):
        """ Write each bit of the xml. """
        content = ''
        content = self.template['header']
        looplength = len(self.results)
        i = 0
        for item in self.results:
            i += 1
            content += self.write_item(item)
            # If it's not the last item in the list, add a comma.
            # *** We need a way to configure this.
            if i < looplength:
                content += ','
        content += self.template['footer']
        return content

    def write_item(self, item):
        """ Marry the XML fields we're using to the template. Return a string."""
        content = self.template['item']
        for field in item:
            # The item is a dict.
            # The dict's keys are the field names we're searching and replacing
            # with the dict's values.
            content = content.replace('{{%s}}' % field, item[field].replace("'", "\\'"))
        return content

    

def main(pub, slug, url):
    """ What we execute when we execute from the command line."""
    parser = OptionParser()
    parser.add_option("-t", "--test", dest="test", action="store_true", default=False)
    (options, args) = parser.parse_args()
    if slug == '':
        slug = 'all'
    fh = FileWrapper('infinite-%s.js' % slug)

    # Get the XML
    # We don't want to download the file every time while testing, thus, testing logic.
    fh_xml = FileWrapper('infinite-%s.xml' % slug)
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
            'seoDescriptiveText': 'seo_url_suffix',
            'launchDate': 'date_published',
            'updateDate': 'date_updated',
            'byline': 'byline',
            'headline': 'title',
            'body': 'body',
            'overline': 'overline',
            'subHead': 'subtitle',
            'sectionAnchor': 'section_anchor',
        }
    }
    template = {
        'header': 'var ar = new Array(',
        'item' : """
    {
        overline: '{{overline}}',
        title: '{{title}}',
        body: '{{body}}',
        byline: '{{byline}}',
        path: { prefix: '{{section_anchor}}/ci_', id: {{id}}, suffix: '{{seo_url_suffix}}' },
        date_published: '{{date_published}}',
        date_updated: '{{date_updated}}'
    }""",
        'footer': ');'
    }
    parser = ParseXml(markup, fields, template)

    # Parse out the pieces we want.
    articles = parser.parse_xml()
    
    # For each article, scrape it from the site. That's the easiest way to get
    # its related content, freeforms, packages, photos etc.
    i = 0
    for article in articles:
        url = 'http://www.denverpost.com/ci_%s' % article['id']
        fh = FileWrapper('article')
        article = fh.request(url)
        if article != '':
            # Parse out everything between the articlePositionHeader and the 
            # end of the articlePositionFooter div
            pattern = '.*(<div class="articlePositionHeader">.*</div>)<span class="articleFooterLinks">'
            regex = re.compile(pattern, re.MULTILINE|re.DOTALL)
            r = regex.search(article)
            regex.match(article)
            body = r.groups()[0]
            if body != '':
                # Strip out any window.location redirects ala
                # window.location.replace(\'http://blogs.denverpost.com/thespot/2014/08/15/cory-gardner-mark-udall-flooding/111439/\');
                body = re.sub("window\.location\.replace\(\\'([^\\\]+)\\'\);","", body)

                # Kill any document.write's
                body = re.sub("document\.write\(([^\)]+)\);", "", body)

                # Strip out the newline characters.
                body = body.replace('\n', '')

                # Remove the in-article ads
                body = re.sub("<div id='dfp-EMBEDDED'>.*<!-- End DFP Premium ad uniqueId: dfp-EMBEDDED -->", "", body)

                articles[i]['body'] = body
            i += 1

    output = parser.write_xml()

    # Write those pieces to another file.
    fh = FileWrapper('articles-%s.js' % slug)
    fh.write(output)

    # FTP that file to a production server.
    if options.test == False:
        ftz = FtpWrapper('mntech\dptemp', 'ftp1.denverpost.com', '/DenverPost/cache/article')
        ftz.ftp_file('articles-%s.js' % slug)


if __name__ == '__main__':
    data = { 
            'denverpost': [
                ('all', 'http://rss.denverpost.com/mngi/rss/CustomRssServlet/36/301000.xml'),
                ('business', 'http://rss.denverpost.com/mngi/rss/CustomRssServlet/36/259388.xml'),
             ],
    }
    for pub in data:
        print pub
        for item in data[pub]:
            slug = item[0]
            url = item[1]
            main(pub, slug, url)
