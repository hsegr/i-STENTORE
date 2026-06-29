/*
 *  This file is part of the i-STENTORE project.
 *
 *  (Reserved for license)
 */

plugins {
    `java-library`
}

dependencies {
    implementation(libs.edc.connector.core)
    implementation(libs.edc.identity.trust.core)
    implementation(libs.edc.lib.jws2020)
}