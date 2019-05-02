"use strict";
const pulumi = require("@pulumi/pulumi");
const aws = require("@pulumi/aws");
const awsx = require("@pulumi/awsx");

const vpc = new aws.ec2.Vpc("homelab", {
    cidrBlock: '10.0.50.0/24',
    enableDnsHostnames: true,
})

const subnet = new aws.ec2.Subnet("hlsub", {
    cidrBlock: '10.0.50.0/27',
    vpcId: vpc.id,
    mapPublicIpOnLaunch: true,
})

const igw = new aws.ec2.InternetGateway("hligw",{
    vpcId: vpc.id
})

const rt = new aws.ec2.RouteTable("rt-external", {
    routes: [
        {cidrBlock: "0.0.0.0/0", gatewayId: igw.id}
    ],
    vpcId: vpc.id,
})

const routeTableAssociation = new aws.ec2.RouteTableAssociation("a", {
    routeTableId: rt.id,
    subnetId: subnet.id,
});

const group = new aws.ec2.SecurityGroup("webserver-secgrp", {
    egress: [
        { protocol: "-1", fromPort:0, toPort: 0, cidrBlocks: ["0.0.0.0/0"]},
    ],
    ingress: [
        { protocol: "tcp", fromPort: 80, toPort: 80, cidrBlocks: ["0.0.0.0/0"] },
        { protocol: "tcp", fromPort: 22, toPort: 22, cidrBlocks: ["0.0.0.0/0"] }
    ],
    vpcId: vpc.id
});

const vpn = new aws.ec2.CustomerGateway("cg-homelab", {
    bgpAsn: 65000,
    ipAddress: '67.181.97.174',
    type: 'ipsec.1',
})

const vpngw = new aws.ec2.VpnGateway("vgw-homelab", {
    vpcId: vpc.id
})

const homelabVpn = new aws.ec2.VpnConnection("vpn-homelab", {
    customerGatewayId: vpn.id,
    type: 'ipsec.1',
    vpnGatewayId: vpngw.id,
    staticRoutesOnly: true,
})

const lablan = new aws.ec2.VpnConnectionRoute("homelab-lab",{
    destinationCidrBlock: "192.168.1.0/24",
    vpnConnectionId: homelabVpn.id,
})

exports.ipconn = homelabVpn.tunnel1Address;
exports.psk = homelabVpn.tunnel1PresharedKey;